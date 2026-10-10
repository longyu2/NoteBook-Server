# 数据库迁移（手工版）

数据库：**NotebookDB**（MySQL 8.0，本机 3306）
账本表：`schema_migrations(version, applied_at)`

## 目录说明

```
db/migrations/
  V001__baseline.sql          ← 冻结基线：2026-10-10 从真实库导出，永不修改
  V002__add_is_ai_generated.sql ← 给 Notebooklist 加「正文是否 AI 生成」
  V003__backfill_is_ai_generated.sql ← 把历史文章的该字段收敛为 0
  README.md                   ← 本文件
  history/                    ← 历史档案（**勿执行**）
    NoteBook.sql              ← 原根目录的建表脚本（已弃用，开头有 DROP DATABASE）
    H001..H008__*.sql         ← 按 git 提交记录回溯的 8 次结构变更
```

**命名约定（重要）**：`V` 前缀 = 正式版本序列，按序号执行；
`H` 前缀 = history 档案，只作查阅，**永远不要执行**。
两套名字刻意分开 —— 早期 history 里也叫 `V001..V008`，
结果和正式序列的 `V002` 撞名，容易误跑，所以统一改成 `H`。

`history/` 里的 8 个文件是按 git 提交记录**回溯拟写**的，不是真实跑过的脚本。
它们放在单独目录、不参与版本序列，原因见下面「关于基线」。

## 标准流程（以后每次加字段都照这个走）

1. **写文件** `db/migrations/V00N__add_xxx.sql`（N 取当前最大号 +1；写幂等的 DDL）
2. **执行** `mysql -h 127.0.0.1 -u root -p NotebookDB < db/migrations/V00N__add_xxx.sql`
3. **记账** `mysql -h 127.0.0.1 -u root -p NotebookDB -e "INSERT INTO schema_migrations (version) VALUES ('V00N');"`
4. **提交** `git add db/migrations/ && git commit -m "feat: Notebooklist 增加 xxx 字段"`

> `mysql` 不在 PATH 里，真实路径 `C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe`；
> 密码在 `config/server-config.json` → `mysql_setting.password`，用 `MYSQL_PWD` 环境变量传。

## 已执行到哪版

| 版本 | 内容 | 执行时间 |
|---|---|---|
| V001 | 冻结基线（真实库导出，5 张业务表） | 2026-10-10 |
| V002 | `Notebooklist.is_ai_generated TINYINT(1) DEFAULT 0` | 2026-10-10 |
| V003 | 历史文章 `is_ai_generated` 回填为 0（NULL → 0） | 2026-10-10 |

**两边都要执行**（见下节「两套数据库」）：上表在**本机开发库**和**线上库**都已跑到 V003。

## 两套数据库（重要，别只迁一边）

| | 本机开发库 | 线上库 |
|---|---|---|
| 位置 | `127.0.0.1:3306` | `192.168.1.3`（SSH 端口 **9991**，用户 `root`，用 `~/.ssh/id_rsa`） |
| 应用 | 本地 `pnpm dev`（:9999） | `/home/longyu/www/notebook-Server`，pm2 进程名 `dist` |
| 规模 | 几十篇（开发数据） | 1900+ 篇（真实数据） |
| MySQL | 8.0 | 8.0.46-0ubuntu |

**它们是两个完全独立的 MySQL 实例**，只是库名都叫 `NotebookDB`。
线上 MySQL **只监听 127.0.0.1**，从开发机直连 3306 会 `ECONNREFUSED`，
必须走 SSH 隧道/远程执行。

只迁本机不迁线上，会出现这个现象：新接口在本地正常，
**线上却永久挂起**（不是 404）—— 因为 Express 4 的 async 路由里
`update ... set is_ai_generated` 抛 `Unknown column`，没人 catch，
请求就永远不返回。踩过一次，见下。

线上迁移的正确姿势（把本地迁移文件直接喂给远程 mysql）：

```bash
ssh 192.168.1.3 'export MYSQL_PWD="<密码>"; mysql -h 127.0.0.1 -u root NotebookDB --default-character-set=utf8mb4' \
  < db/migrations/V002__add_is_ai_generated.sql
```

线上账本表也是同样方式建：`schema_migrations` 之前**根本不存在**，
第一次迁移时补建并登记 `V001`（线上结构本就等于基线）。

> 线上密码与本地相同，在 `config/server-config.json` → `mysql_setting.password`。
> 动结构前先备份：`mysqldump --single-transaction ... > /root/db-backup/xxx.sql`。

## 查当前跑到哪版

```bash
mysql -h 127.0.0.1 -u root -p NotebookDB -e "SELECT * FROM schema_migrations ORDER BY version;"
```

## 换机器 / 重建库

```bash
mysql -h 127.0.0.1 -u root -p 新库名 < db/migrations/V001__baseline.sql
mysql -h 127.0.0.1 -u root -p 新库名 -e "
  CREATE TABLE schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO schema_migrations (version) VALUES ('V001');"
```

## 四条规矩

1. 加字段给默认值、允许 NULL。
2. **已经跑过的文件不改**，改错就加一个新文件。
3. 删字段、改类型、加非空无默认列，**别和代码发布一起做**，延后一版。
4. 回退代码时，库不动（因为变更都是向前兼容的）。

---

## 关于基线：为什么 `history/` 不参与版本序列

**`V001__baseline.sql` 是唯一的真相来源**，因为它是从**真实数据库**导出的。
仓库里那份 `NoteBook.sql` 已经和真实库**漂移**了 —— 实测对比：

| 项目 | 仓库 `NoteBook.sql` 写的 | 真实库实际是 |
|---|---|---|
| `folders.userid` | `int not null` + 外键 | `int DEFAULT NULL`，**没有外键** |
| `folders.folder_name` | `nvarchar(100) unique not null` | `varchar(100) ... DEFAULT NULL`，**没有 UNIQUE** |
| `title` / `folder_name` 类型 | `nvarchar(...)` | `varchar(...)`（MySQL 没有 `nvarchar`，这是 SQL Server 类型） |

也就是说 `b04f5b4` 那次「给 folders 加 not null / unique 约束」的变更，
**在这个库里根本没生效**。所以：

- 拿 git 历史回溯出来的 DDL 去重建库，会得到一个**和生产不一样**的结构 —— 这是个陷阱。
- 因此 `history/` 只作档案，**不要执行**；重建库一律用 `V001__baseline.sql`。

### `NoteBook.sql` 已归档，不要使用

根目录那份 `NoteBook.sql` 已移到 **`db/migrations/history/NoteBook.sql`**，
和回溯出来的历史档案放在一起。它**不作为建库依据**，文件头已加弃用声明。
两个原因：

1. 它开头就是 `drop database if exists NotebookDB;` —— **直接执行会清空真实数据库**。
2. 内容已与真实库漂移（见上表），拿它建库会得到错误的结构。

> 它曾经是仓库里唯一的建表脚本，现在这个角色由 `V001__baseline.sql` 接替。
> 留着它只为查阅「当年是怎么建的库」。

## 关于种子数据（已知缺口）

`V001__baseline.sql` 是 `--no-data` 导出的，**只有结构、没有数据**。
所以用它重建出来的是一个**空库** —— `userinfo` 里没有任何用户，**登录不进去**。

要跑起来需要另外补一份种子数据（至少一个管理员账号）。
`NoteBook.sql` 里原来那两条 `insert into userinfo`（`admin` / `user2`，密码都是 `123456`）
可以拿来做参考，但**明文弱口令，别用在对外环境**。

如果以后需要，可以单独放 `db/seed/dev-seed.sql`（不进迁移序列，按需手动跑）。


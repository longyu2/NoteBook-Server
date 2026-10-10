# 数据库迁移（手工版）

数据库：**NotebookDB**（MySQL 8.0，本机 3306）
账本表：`schema_migrations(version, applied_at)`

## 目录说明

```
db/migrations/
  V001__baseline.sql      ← 冻结基线：2026-10-10 从真实库导出，永不修改
  README.md               ← 本文件
  history/                ← 历史变更记录（**已执行，勿再跑**，仅作档案）
```

`history/` 里的 8 个文件是按 git 提交记录**回溯拟写**的，不是真实跑过的脚本。
它们放在单独目录、不参与版本序列，原因见下面「关于基线」。

## 标准流程（以后每次加字段都照这个走）

1. **写文件** `db/migrations/V002__add_xxx.sql`
2. **执行** `mysql -h 127.0.0.1 -u root -p NotebookDB < db/migrations/V002__add_xxx.sql`
3. **记账** `mysql -h 127.0.0.1 -u root -p NotebookDB -e "INSERT INTO schema_migrations (version) VALUES ('V002');"`
4. **提交** `git add db/migrations/ && git commit -m "feat: Notebooklist 增加 xxx 字段"`

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

`NoteBook.sql` 建议保留但**不再当作建库依据**（可以只留注释说明它已过时）。

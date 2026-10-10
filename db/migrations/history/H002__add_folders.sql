-- ============================================================
-- V002  引入文件夹功能；删除历史版本表
-- 来源提交：e6ca616  A three-tier architecture is used, add folder  (2023-01-14)
-- 状态：已执行 —— 仅作历史档案，请勿再跑
-- ============================================================
-- 新增 folders（文件夹）与 folder_notebook（文件夹←→文章 多对多关联）。
-- 同时删掉了 Notebookhistory —— 历史版本功能被放弃。

CREATE TABLE folders (
  folder_id   int PRIMARY KEY AUTO_INCREMENT,
  folder_name varchar(100)            -- 原脚本写的是 nvarchar(100)
);

CREATE TABLE folder_notebook (
  folder_id  int NOT NULL,
  notebookid int NOT NULL,
  FOREIGN KEY (folder_id)  REFERENCES folders (folder_id),
  FOREIGN KEY (notebookid) REFERENCES Notebooklist (Notebookid),
  PRIMARY KEY (folder_id, notebookid)
);

-- 历史版本表不再需要
DROP TABLE IF EXISTS Notebookhistory;

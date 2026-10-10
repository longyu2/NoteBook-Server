-- ============================================================
-- V005  folders 增加约束（userid 非空、folder_name 唯一）
-- 来源提交：b04f5b4  fix: move out folder button  (2023-11-18)
-- 状态：已执行 —— 仅作历史档案，请勿再跑
-- ============================================================
-- 原脚本是在 CREATE TABLE 里直接改的列定义，这里按迁移语义写成 ALTER。
--
-- !! 重要 !! 这两条约束在真实库里【并未生效】：
--   实测 2026-10-10 导出，folders 实际是
--     userid      int DEFAULT NULL      （不是 NOT NULL，也没有外键）
--     folder_name varchar(100) DEFAULT NULL  （没有 UNIQUE）
--   原因不明（可能当初是手工建表，没跑这份脚本）。
--   本文件只是记录「当时想改什么」，不代表当前结构。
--   当前结构一律以 V001__baseline.sql 为准。

ALTER TABLE folders MODIFY COLUMN userid int NOT NULL;

ALTER TABLE folders MODIFY COLUMN folder_name varchar(100) NOT NULL;

ALTER TABLE folders ADD CONSTRAINT uq_folders_folder_name UNIQUE (folder_name);

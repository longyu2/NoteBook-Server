-- ============================================================
-- V006  新增 images 表
-- 来源提交：693230d  修复代码  (2025-03-11)
-- 状态：已执行 —— 仅作历史档案，请勿再跑
-- ============================================================
-- 记录文章里用到的图片，便于删除文章时清理图片文件。
--
-- !! 注意 !! 原脚本的外键写的是 references articles(notebookid)，
--   但项目里【根本没有 articles 这张表】（实际叫 Notebooklist）。
--   照抄执行会直接报错。这里保留原样以示记录，修复见 V007。

CREATE TABLE images (
  notebookid int NOT NULL,
  img_id     int NOT NULL,
  img_path   text,
  FOREIGN KEY (notebookid) REFERENCES articles (notebookid),   -- 表名错误，见 V007
  PRIMARY KEY (img_id)
);

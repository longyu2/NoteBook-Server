-- ============================================================
-- V007  修正 images：img_id 自增 + 外键指向修正
-- 来源提交：002372a  添加了检测，在 public 文件夹不存在时自动创建  (2025-03-11)
-- 状态：已执行 —— 仅作历史档案，请勿再跑
-- ============================================================
-- 修掉 V006 留下的两个问题：
--   1. img_id 没有 AUTO_INCREMENT，插入时要自己算 id；
--   2. 外键指向了不存在的 articles 表，改为正确的 Notebooklist。

ALTER TABLE images MODIFY COLUMN img_id int NOT NULL AUTO_INCREMENT;

ALTER TABLE images DROP FOREIGN KEY images_ibfk_1;

ALTER TABLE images
  ADD CONSTRAINT images_ibfk_1
  FOREIGN KEY (notebookid) REFERENCES Notebooklist (Notebookid);

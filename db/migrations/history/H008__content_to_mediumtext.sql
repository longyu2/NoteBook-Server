-- ============================================================
-- V008  Notebooklist.content 扩容：text -> mediumtext
-- 来源提交：160970f  增加文件上传接口  (2026-01-10)
-- 状态：已执行 —— 仅作历史档案，请勿再跑
-- ============================================================
-- text 上限 64KB，长文 + 内嵌图片会撑爆，改成 mediumtext（上限 16MB）。

ALTER TABLE Notebooklist MODIFY COLUMN content mediumtext;

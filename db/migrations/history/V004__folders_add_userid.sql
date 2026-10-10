-- ============================================================
-- V004  folders 增加 userid 列
-- 来源提交：3a1c0fb  Added that different users can only browse their own articles  (2023-07-04)
-- 状态：已执行 —— 仅作历史档案，请勿再跑
-- ============================================================
-- 让文件夹归属到用户，实现「每个用户只能看到自己的文章」。

ALTER TABLE folders ADD COLUMN userid int REFERENCES userinfo (userid);

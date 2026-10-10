-- ============================================================
-- V003: 把历史文章的 is_ai_generated 一律回填为 0（非 AI 生成）
-- 日期: 2026-10-10
-- 依赖: V002__add_is_ai_generated.sql
--
-- 背景:
--   V002 用 `DEFAULT 0` 加列，MySQL 8 会把已有行一并填成 0。
--   但该列允许 NULL（遵守迁移四条规矩第 1 条），
--   任何绕过默认值的写入路径（显式插 NULL、导入旧数据）都可能留下 NULL。
--   本迁移把 NULL 统一收敛成 0，保证「非 0 即 1」的语义。
--
-- 幂等: WHERE is_ai_generated IS NULL，重跑影响 0 行。
--       刻意**不写**无条件的 SET = 0 —— 那样一旦重跑会把真实标记抹掉。
-- ============================================================

UPDATE Notebooklist
SET is_ai_generated = 0
WHERE is_ai_generated IS NULL;

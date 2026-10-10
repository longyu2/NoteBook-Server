-- ============================================================
-- V002: Notebooklist 增加「正文是否由 AI 生成」标记
-- 日期: 2026-10-10
-- 依赖: V001__baseline.sql
--
-- 设计:
--   - 加字段给默认值 0，旧文章一律视为「非 AI 生成」
--   - 允许 NULL（遵守迁移四条规矩第 1 条），代码侧用真值判断即可
--   - 幂等: MySQL 8.0 没有 ADD COLUMN IF NOT EXISTS，
--           用 information_schema 判断后再决定是否执行 DDL
-- ============================================================

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Notebooklist'
    AND COLUMN_NAME = 'is_ai_generated'
);

SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE Notebooklist ADD COLUMN is_ai_generated TINYINT(1) DEFAULT 0 AFTER content',
  'DO 0'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

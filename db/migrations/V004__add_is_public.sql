-- ============================================================
-- V004: Notebooklist 增加「是否公开」标记
-- 日期: 2026-10-11
-- 依赖: V003__backfill_is_ai_generated.sql
--
-- 设计:
--   - 加字段给默认值 0，历史文章一律视为「不公开」（不会突然把 1900 篇全暴露出去）
--   - 允许 NULL（遵守迁移四条规矩第 1 条），代码侧用真值判断即可
--   - 加索引：公开页要按 is_public 过滤 + createtime 排序，
--     线上 1900+ 篇虽然不大，但索引很便宜
--   - 幂等: MySQL 8.0 没有 ADD COLUMN IF NOT EXISTS，
--           用 information_schema 判断后再决定是否执行 DDL
-- ============================================================

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Notebooklist'
    AND COLUMN_NAME = 'is_public'
);

SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE Notebooklist ADD COLUMN is_public TINYINT(1) DEFAULT 0 AFTER is_ai_generated',
  'DO 0'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Notebooklist'
    AND INDEX_NAME = 'idx_notebooklist_public'
);

SET @ddl2 := IF(
  @idx_exists = 0,
  'ALTER TABLE Notebooklist ADD INDEX idx_notebooklist_public (is_public, createtime)',
  'DO 0'
);

PREPARE stmt2 FROM @ddl2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

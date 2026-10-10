-- ============================================================
-- V001  初始建库建表
-- 来源提交：1b569a5  init project  (2022-12-13)
-- 状态：已执行 —— 仅作历史档案，请勿再跑
-- ============================================================
-- 建了三张表：userinfo / Notebooklist / Notebookhistory（历史版本表）。

CREATE DATABASE IF NOT EXISTS NotebookDB;
USE NotebookDB;

CREATE TABLE userinfo (
  userid   int PRIMARY KEY AUTO_INCREMENT,
  username varchar(20) UNIQUE,
  userpwd  varchar(20)
);

CREATE TABLE Notebooklist (
  Notebookid int PRIMARY KEY AUTO_INCREMENT,
  authorid   int NOT NULL,
  title      varchar(200) NOT NULL,   -- 原脚本写的是 nvarchar(200)
  createtime datetime(0) NOT NULL,
  updatetime datetime(0) NOT NULL,
  content    text,
  FOREIGN KEY (authorid) REFERENCES userinfo (userid)
);

-- 为保存历史信息设计的表（后来在 V002 被删除）
CREATE TABLE Notebookhistory (
  Notebookid int,
  authorid   int NOT NULL,
  title      varchar(200) NOT NULL,
  createtime datetime(0) NOT NULL,
  updatetime datetime(0) NOT NULL,
  content    text,
  historyid  int PRIMARY KEY AUTO_INCREMENT,
  FOREIGN KEY (authorid) REFERENCES userinfo (userid)
);

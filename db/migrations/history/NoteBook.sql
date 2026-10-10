-- ============================================================================
--  【已弃用 · DEPRECATED】不要执行本文件！
--  归档位置：db/migrations/history/ —— 仅作历史查阅，不参与迁移序列。
-- ----------------------------------------------------------------------------
-- 1) 文件开头就是 `drop database if exists NotebookDB;` —— 直接跑会**清空真实数据库**。
-- 2) 内容已与真实库漂移（例如 folders 的约束和真实库不一致），
--    拿它建库会得到一个和生产不一样的结构。
--
-- 建库 / 重建数据库一律使用：db/migrations/V001__baseline.sql
-- （该基线由真实库 mysqldump --no-data 导出，是唯一的结构真相来源。）
-- 变更流程见 db/migrations/README.md。
--
-- 本文件不保证与线上一致。
-- ============================================================================

drop database if exists NotebookDB;
create database NotebookDB;
use NotebookDB;



-- 用户表
drop table if exists userinfo;
create table userinfo(
userid int primary key auto_increment,
username varchar(20) unique,
userpwd varchar(20),
email varchar(200)
);
insert into userinfo (username,userpwd) values('admin','123456');
insert into userinfo (username,userpwd) values('user2','123456');

-- --文章表
drop table if exists Notebooklist;
create table Notebooklist(
Notebookid int primary key auto_increment,
authorid int not null,
title nvarchar(200) not null,
createtime datetime(0) not null,
updatetime datetime(0) not null,
content mediumtext,
foreign key(authorid) references userinfo(userid)
);
insert into Notebooklist(authorid,title,createtime,updatetime,content) values
(1,'第一条测试数据','2020-05-20 22:22:22',now(),'我是content1');




-- 文件夹表
drop table if exists folders;
create table folders(
    userid int not null references userinfo(userid),
	folder_id int primary key auto_increment,
    folder_name nvarchar(100) unique not null
);
insert into folders (userid,folder_name )values (1,'测试文件夹');
select * from  folders;

-- 文件夹——文章表
drop table if exists folder_notebook;
create table folder_notebook (
	folder_id int not null ,
    notebookid int not null,
    foreign key(folder_id) references folders(folder_id),
    foreign key(Notebookid) references Notebooklist(Notebookid),
    primary key(folder_id,notebookid)
);



--  图片表
drop table if exists images;
create table  images (
    notebookid int not null,
    img_id int not null AUTO_INCREMENT,
    img_path text,
     
     foreign key(notebookid) references Notebooklist(Notebookid),
     primary key (img_id)
);







select * from Notebooklist order by createtime asc ;

-- 根据文件夹id查询文章
 select * from folder_notebook s1,notebooklist s2 where 
s1.notebookid = s2.Notebookid and s1.folder_id = 1;


-- 查询未分类的文章
-- select  * from Notebooklist where Notebookid not in (select notebookid from folder_notebook );
delete from folders  where folder_id = 1;



select * from userinfo;

-- 搜索功能




drop database if exists NotebookDB;
create database NotebookDB;
use NotebookDB;

drop table if exists userinfo;

-- 用户表
create table userinfo(
userid int primary key auto_increment,
username varchar(20) unique,
userpwd varchar(20)
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
content text,
foreign key(authorid) references userinfo(userid)
);
-- insert into Notebooklist(authorid,title,createtime,updatetime,content) values
-- (1,'asp。net教程',now(),now(),'我是content1');
-- insert into Notebooklist(authorid,title,createtime,updatetime,content) values
-- (2,'测试',now(),now(),'我是content2');

-- 文件夹表
create table folders(
	folder_id int primary key auto_increment,
    folder_name nvarchar(100)
);
insert into folders (folder_name )values ('测试文件夹');
insert into folders (folder_name )values ('测试文件夹2');
insert into folders (folder_name )values ('测试文件夹3');
insert into folders (folder_name )values ('测试文件夹4');
insert into folders (folder_name )values ('测试文件夹5');
-- 文件夹——文章表
create table folder_notebook (
	folder_id int not null ,
    notebookid int not null,
    foreign key(folder_id) references folders(folder_id),
    foreign key(Notebookid) references Notebooklist(Notebookid),
    primary key(folder_id,notebookid)
);
-- insert into folder_notebook values (1,1);


select * from Notebooklist order by createtime asc;

-- 根据文件夹id查询文章
-- select * from folder_notebook s1,notebooklist s2 where 
-- s1.notebookid = s2.Notebookid and s1.folder_id = 1;

select * from folders;
select * from folder_notebook;
select  * from Notebooklist;

-- 查询未分类的文章
-- select  * from Notebooklist where Notebookid not in (select notebookid from folder_notebook );
delete from folders  where folder_id = 1;

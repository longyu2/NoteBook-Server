drop database if exists NotebookDB;
create database NotebookDB;
use NotebookDB;

drop table if exists userinfo;

-- 用户表
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
content text,
foreign key(authorid) references userinfo(userid)
);
insert into Notebooklist(authorid,title,createtime,updatetime,content) values
(1,'第一条测试数据','2020-05-20 22:22:22',now(),'我是content1');
-- insert into Notebooklist(authorid,title,createtime,updatetime,content) values
-- (2,'测试',now(),now(),'我是content2');

select * from Notebooklist;

-- 文件夹表
create table folders(
    userid int not null references userinfo(userid),
	folder_id int primary key auto_increment,
    folder_name nvarchar(100) unique not null
);
insert into folders (userid,folder_name )values (1,'测试文件夹');
select * from  folders;

-- 文件夹——文章表
create table folder_notebook (
	folder_id int not null ,
    notebookid int not null,
    foreign key(folder_id) references folders(folder_id),
    foreign key(Notebookid) references Notebooklist(Notebookid),
    primary key(folder_id,notebookid)
);

select * from folder_notebook ;




select * from Notebooklist order by createtime asc ;

-- 根据文件夹id查询文章
 select * from folder_notebook s1,notebooklist s2 where 
s1.notebookid = s2.Notebookid and s1.folder_id = 1;

select * from folders;
select * from folder_notebook;
select  * from Notebooklist;

-- 查询未分类的文章
-- select  * from Notebooklist where Notebookid not in (select notebookid from folder_notebook );
delete from folders  where folder_id = 1;



select * from userinfo;


drop database if exists Notebookdb;

create database NotebookDB;

use NotebookDB;
drop table if exists userinfo;

create table userinfo(
userid int primary key auto_increment,
username varchar(20) unique,
userpwd varchar(20)
)
;
insert into userinfo (username,userpwd) values('admin','123456');




-- --创建博客表
drop table if exists Notebooklist;

create table Notebooklist(
Notebookid int primary key auto_increment,
authorid int not null,
title nvarchar(200) not null,
createtime datetime(0) not null,
updatetime datetime(0) not null,
content text,
foreign key(authorid) references userinfo(userid)
)
;
insert into Notebooklist(authorid,title,createtime,updatetime,content) values (1,'asp。net教程',now(),now(),'我是content1');
insert into Notebooklist(authorid,title,createtime,updatetime,content)  values (1,'asp。net教程',now(),now(),'我是content2');
insert into Notebooklist (authorid,title,createtime,updatetime,content) values (1,'asp。net教程',now(),now(),'我是content3');
insert into Notebooklist(authorid,title,createtime,updatetime,content)  values (1,'asp。net教程',now(),now(),'我是content4');






-- 为保存历史信息，设计新表用于存储历史版本


drop table if exists Notebookhistory;


create table Notebookhistory(

Notebookid int  ,
authorid int not null,
title nvarchar(200) not null,
createtime datetime(0) not null,
updatetime datetime(0) not null,
content text,
historyid int primary key auto_increment,
foreign key(authorid) references userinfo(userid)
);

-- insert into Notebookhistory select * from  Notebooklist where Notebookid =1




-- insert into Notebookhistory select * from  Notebooklist where Notebookid =1 
-- update Notebooklist set authorid=1 ,title='修改测试',content='修改测试',updatetime=now() where Notebookid = 1; 



select * from userinfo;
select * from Notebooklist order by createtime desc ;
select title, content from Notebooklist where Notebookid = 1;
select * from Notebookhistory;
select * from Notebooklist;


select * from Notebooklist where Notebookid =1;


-- 添加新的空白博客并查询
-- insert into Notebooklist(authorid,title,createtime,updatetime,content)  values (1,'',now(),now(),'');
 -- select  *  from Notebooklist where Notebookid = (select max(Notebookid) from Notebooklist) 
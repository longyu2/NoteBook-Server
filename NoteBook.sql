drop database if exists NotebookDB;
create database NotebookDB;
use NotebookDB;

drop table if exists userinfo;
create table userinfo(
userid int primary key auto_increment,
username varchar(20) unique,
userpwd varchar(20)
);
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
);
insert into Notebooklist(authorid,title,createtime,updatetime,content) values (1,'asp。net教程',now(),now(),'我是content1');



create table folders(
	folder_id int primary key auto_increment,
    folder_name nvarchar(100)
);
insert into folders (folder_name )values ('测试文件夹');


create table folder_notebook (
	folder_id int not null ,
    notebookid int not null,
    foreign key(folder_id) references folders(folder_id),
    foreign key(Notebookid) references Notebooklist(Notebookid),
    primary key(folder_id,notebookid)
);

insert into folder_notebook values (1,1); 

select * from folders;
-- select * from userinfo;
-- select * from Notebooklist order by createtime desc ;
-- select title, content from Notebooklist where Notebookid = 1;
 select * from Notebooklist;
-- select * from Notebooklist where Notebookid =1;
select * from folder_notebook;


-- 根据文件夹id查询文章
select * from folder_notebook s1,notebooklist s2 where s1.notebookid = s2.Notebookid and s1.folder_id = 1

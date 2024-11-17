use student_registration;
select * from students;

alter table students
add password varchar(100) not null;

set sql_safe_updates = 0;
delete from students;

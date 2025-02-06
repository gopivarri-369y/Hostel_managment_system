--  student tabel creation 

USE student_registration;
drop table students;
CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(50), 
    lastname VARCHAR(50),
    gender VARCHAR(10),
    age INT,
    email VARCHAR(100), 
    phone VARCHAR(15),
    password VARCHAR(100)
);


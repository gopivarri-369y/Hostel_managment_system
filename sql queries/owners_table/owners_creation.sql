-- owners table creation 

USE student_registration;


CREATE TABLE owners (
  owner_id int NOT NULL AUTO_INCREMENT,
  fname varchar(30) DEFAULT NULL,
  Lname varchar(30) DEFAULT NULL,
  gender varchar(20) DEFAULT NULL,
  age int DEFAULT NULL,
  email varchar(50) DEFAULT NULL,
  password varchar(100) DEFAULT NULL,
  phone bigint DEFAULT NULL,
  PRIMARY KEY (owner_id)
)
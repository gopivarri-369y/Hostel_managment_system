use student_registration;
-- drop table owners_info;
CREATE TABLE owners_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    gender ENUM('male', 'female', 'other'),
    age INT,
    email VARCHAR(100),
    phone VARCHAR(20),
    collage VARCHAR(100),
    hostel VARCHAR(100),
    roomsFor ENUM('boys', 'girls'),
    room2Share BOOLEAN,
    room3Share BOOLEAN,
    room4Share BOOLEAN,
    rent2Share DECIMAL(10, 2),
    rent3Share DECIMAL(10, 2),
    rent4Share DECIMAL(10, 2)
);

describe owner_hostel_rooms;
select * from owners_info;
alter table owner_info 
add column password varchar(20);
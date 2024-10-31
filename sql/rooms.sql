use student_registration;
CREATE TABLE rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id INT NOT NULL,
    room_type ENUM('2_share', '3_share', '4_share') NOT NULL,
    available BOOLEAN NOT NULL,
    rent DECIMAL(10, 2),
    FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id) ON DELETE CASCADE
);
select * from rooms;

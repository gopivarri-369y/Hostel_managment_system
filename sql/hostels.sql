use student_registration;
CREATE TABLE hostels (
    hostel_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_name VARCHAR(100) NOT NULL,
    owner_id INT NOT NULL,
    rooms_for ENUM('Boys', 'Girls') NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES owners(owner_id) ON DELETE CASCADE
);
describe hostels;

select * from hostels;
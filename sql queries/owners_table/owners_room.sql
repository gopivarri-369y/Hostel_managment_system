USE student_registration;

drop table owners_room;

CREATE TABLE owners_room (
  hostel_id int NOT NULL AUTO_INCREMENT,
  college varchar(40) NOT NULL,
  hostel_name varchar(50) NOT NULL,
  roomsfor varchar(10) NOT NULL,
  twoshare int NOT NULL,
  tworent int NOT NULL,
  threeshare int NOT NULL,
  threerent int NOT NULL,
  fourshare int NOT NULL,
  fourrent int NOT NULL,
  pincode int NOT NULL,
  owner_id int NOT NULL,
  PRIMARY KEY (hostel_id),
  KEY fk_owner_id (owner_id)
)
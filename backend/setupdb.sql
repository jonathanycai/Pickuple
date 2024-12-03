-- How to Use:
-- 1. Make sure you are in the backend directory
-- 2. Run: scp -r ./setupdb.sql <CWL-ID>@remote.students.cs.ubc.ca:<destination-directory-on-remote-server>
-- 3. SSH into UBC CS Remote Server using the db-tunnel.sh script
-- 4. Navigate to directory with destination directory for setupdb.sql
-- 4. Login to Oracle SQL*Plus CLI (run: sqlplus ora_<CWL>@stu)
-- 5. Run: start setupdb.sql;

-- NOTE: If you aren't getting any data from your queries it may be because you are logged in to SQL*Plus via the SSH.
--       To fix that, just quit out of SQL*Plus on your ssh'd terminal.

drop table registers;
drop table commentedOn;
drop table replyTo;
drop table Comments;
drop table Doubles;
drop table Singles;
drop table Reservation;
drop table GameInvite;
drop table UserInfo;
drop table UserLocation;
drop table Picture;
drop table Court;
drop table CourtMaterial;
drop table ProvinceLocation;
drop table Location;
drop table CityLocation;


CREATE TABLE CityLocation(
	postalCode	CHAR(6)   PRIMARY KEY,
	city		VARCHAR(45)   NOT NULL
);

CREATE TABLE Location(
	address	VARCHAR(30),
	postalCode	CHAR(6),
	PRIMARY KEY(address, postalCode),
	FOREIGN KEY(postalCode) REFERENCES CityLocation
);

CREATE TABLE ProvinceLocation(
	postalCode	CHAR(6)   PRIMARY KEY,
	province	VARCHAR(20)   NOT NULL,
	FOREIGN KEY(postalCode) REFERENCES CityLocation
);

CREATE TABLE CourtMaterial(
	surfaceMaterial 	VARCHAR(20)   PRIMARY KEY,
	type			VARCHAR(7)   NOT NULL
);

CREATE TABLE Court(
	courtNumber		INTEGER,
	surfaceMaterial 	VARCHAR(20)   NOT NULL,
	address		VARCHAR(30),
	postalCode		CHAR(6),
	PRIMARY KEY(courtNumber, address, postalCode),
	FOREIGN KEY(address, postalCode) REFERENCES Location(address, postalCode) ON DELETE CASCADE,
	FOREIGN KEY(surfaceMaterial) REFERENCES CourtMaterial
);

CREATE TABLE Picture(
	pictureSrc 	VARCHAR(4000)   PRIMARY KEY,
	altDescription 	VARCHAR(200)
);

CREATE TABLE UserLocation(
	address	VARCHAR(30),
	province	VARCHAR(20),
	city		VARCHAR(45),
	postalCode	CHAR(6)   NOT NULL,
	PRIMARY KEY(address, province, city)
);

CREATE TABLE UserInfo(
	userID		INTEGER   PRIMARY KEY,
	email		VARCHAR(50)   UNIQUE   NOT NULL,
	password	VARCHAR(50)   NOT NULL,
	firstName	VARCHAR(30)   NOT NULL,
	lastName	VARCHAR(30)   NOT NULL,
	profilePicture	VARCHAR(4000),
	address	VARCHAR(30)   NOT NULL,
	province	VARCHAR(20)   NOT NULL,
	city		VARCHAR(45)   NOT NULL,
	FOREIGN KEY(address, province, city) REFERENCES UserLocation(address, province, city)
);

CREATE TABLE GameInvite(
	inviteID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	status NUMBER(1) DEFAULT 1 NOT NULL,
	title VARCHAR(50)	NOT NULL,
	description	VARCHAR(1000),
	thumbnail	VARCHAR(4000),
	creator	INTEGER NOT NULL,
	FOREIGN KEY(thumbnail) REFERENCES Picture ON DELETE SET NULL,
	FOREIGN KEY(creator) REFERENCES UserInfo ON DELETE CASCADE
);

CREATE TABLE Reservation(
	reservationID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	bookingTime	DATE, 
	courtNumber	INTEGER   NOT NULL,
	address	VARCHAR(30)   NOT NULL,
	postalCode	CHAR(6)   NOT NULL,
	UNIQUE(bookingTime, courtNumber, address, postalCode),
	FOREIGN KEY(courtNumber, address, postalCode) REFERENCES Court(courtNumber, address, postalCode) ON DELETE CASCADE
);

CREATE TABLE Singles(
	gameID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reservationID         INTEGER   UNIQUE   NOT NULL,
	gameInviteID         INTEGER   UNIQUE   NOT NULL,
	currentlyEnrolled INTEGER NOT NULL,
	capacity                 INTEGER   NOT NULL,
	isActive NUMBER(1) DEFAULT 1 NOT NULL,
	FOREIGN KEY(reservationID) REFERENCES Reservation ON DELETE CASCADE,
	FOREIGN KEY(gameInviteID) REFERENCES GameInvite ON DELETE CASCADE,
	CONSTRAINT singlesOverCapacity CHECK (currentlyEnrolled <= capacity)
);

CREATE TABLE Doubles(
	gameID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reservationID         INTEGER   UNIQUE   NOT NULL,
	gameInviteID         INTEGER   UNIQUE   NOT NULL,
	currentlyEnrolled INTEGER NOT NULL,
	capacity                 INTEGER   NOT NULL,
	isActive NUMBER(1) DEFAULT 1 NOT NULL,
	FOREIGN KEY(reservationID) REFERENCES Reservation ON DELETE CASCADE,
	FOREIGN KEY(gameInviteID) REFERENCES GameInvite ON DELETE CASCADE,
	CONSTRAINT doublesOverCapacity CHECK (currentlyEnrolled <= capacity)
);

CREATE TABLE Comments(
	commentID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	content 		VARCHAR(500)   NOT NULL,
	commentedBy		INTEGER   NOT NULL,
	FOREIGN KEY(commentedBy) REFERENCES UserInfo ON DELETE CASCADE
);

CREATE TABLE replyTo(
	parentID 	INTEGER,
	replyID		INTEGER,
	PRIMARY KEY (parentID, replyID),
	FOREIGN KEY (parentID) REFERENCES Comments ON DELETE CASCADE,
	FOREIGN KEY (replyID) REFERENCES Comments ON DELETE CASCADE
);

CREATE TABLE commentedOn(
	commentID	INTEGER,
	inviteID	INTEGER,
	PRIMARY KEY (commentID, InviteID),
	FOREIGN KEY (commentID) REFERENCES Comments ON DELETE CASCADE,
	FOREIGN KEY (inviteID) REFERENCES GameInvite ON DELETE CASCADE
);

CREATE TABLE registers(
	userID		INTEGER,
	inviteID	INTEGER,
	PRIMARY KEY (userID, inviteID),
	FOREIGN KEY (userID) REFERENCES UserInfo ON DELETE CASCADE,
	FOREIGN KEY (inviteID) REFERENCES GameInvite ON DELETE CASCADE
);

-- TABLE ASSERTIONS / TRIGGERS

-- Checks to ensure bookingTime is not in the past, and doesn't conflict with a pre-existing booking
-- Note: reservations are default set to last 2 hours
CREATE OR REPLACE TRIGGER check_booking_time
BEFORE INSERT ON RESERVATION
FOR EACH ROW
DECLARE
    time_booked NUMBER;
BEGIN
		SELECT CASE 
			WHEN EXISTS (
				SELECT 1
				FROM RESERVATION r
				WHERE r.courtNumber = :NEW.courtNumber
					AND r.address = :NEW.address
					AND r.postalCode = :NEW.postalCode
					AND :NEW.bookingTime > r.bookingTime
					AND :NEW.bookingTime < r.bookingTime + INTERVAL '2' HOUR
			)
			THEN 1
			ELSE 0
		END
    INTO time_booked
    FROM DUAL;

    IF time_booked = 1 THEN
        RAISE_APPLICATION_ERROR(-20001, 'BookingTime conflicts with an existing reservation.');
    END IF;
    IF :NEW.bookingTime < SYSDATE THEN
        RAISE_APPLICATION_ERROR(-20002, 'BookingTime is in the past.');
    END IF;
END;
/

-- Auto registers the GameInvite creator to the GameInvite
CREATE OR REPLACE TRIGGER register_creator
AFTER INSERT ON GAMEINVITE
FOR EACH ROW
BEGIN
	INSERT INTO Registers(userId, inviteId) VALUES (:NEW.creator, :NEW.inviteId);
END;
/

-- TESTING DATA
INSERT INTO CityLocation(postalCode, City) VALUES ('V23AB1', 'Vancouver');
INSERT INTO CityLocation(postalCode, City) VALUES ('V21PL7', 'Vancouver');
INSERT INTO CityLocation(postalCode, City) VALUES ('VL920N', 'Vancouver');
INSERT INTO CityLocation(postalCode, City) VALUES ('V2BLO1', 'Vancouver');
INSERT INTO CityLocation(postalCode, City) VALUES ('V1PL77', 'Vancouver');

INSERT INTO Location(address, postalCode) VALUES ('123 Sports Ave', 'V23AB1');
INSERT INTO Location(address, postalCode) VALUES ('509 Pickle St', 'V21PL7');
INSERT INTO Location(address, postalCode) VALUES ('123 Ball Rd', 'VL920N');
INSERT INTO Location(address, postalCode) VALUES ('540 Court Rd', 'V2BLO1');
INSERT INTO Location(address, postalCode) VALUES ('752 Racket St', 'V1PL77');

INSERT INTO ProvinceLocation(postalCode, province) VALUES ('V23AB1', 'BC');
INSERT INTO ProvinceLocation(postalCode, province) VALUES ('V21PL7', 'BC');
INSERT INTO ProvinceLocation(postalCode, province) VALUES ('VL920N', 'BC');
INSERT INTO ProvinceLocation(postalCode, province) VALUES ('V2BLO1', 'BC');
INSERT INTO ProvinceLocation(postalCode, province) VALUES ('V1PL77', 'BC');

INSERT INTO CourtMaterial(surfaceMaterial, type) VALUES ('Hardwood', 'Indoor');
INSERT INTO CourtMaterial(surfaceMaterial, type) VALUES ('Rubber', 'Indoor');
INSERT INTO CourtMaterial(surfaceMaterial, type) VALUES ('Plastic Tiles', 'Indoor');
INSERT INTO CourtMaterial(surfaceMaterial, type) VALUES ('Cement', 'Outdoor');
INSERT INTO CourtMaterial(surfaceMaterial, type) VALUES ('Asphalt', 'Outdoor');

INSERT INTO Court(courtNumber, surfaceMaterial, address, postalCode) VALUES (1, 'Hardwood',  '123 Sports Ave', 'V23AB1');
INSERT INTO Court(courtNumber, surfaceMaterial, address, postalCode) VALUES (1, 'Rubber', '509 Pickle St', 'V21PL7');
INSERT INTO Court(courtNumber, surfaceMaterial, address, postalCode) VALUES (1, 'Plastic Tiles', '123 Ball Rd', 'VL920N');
INSERT INTO Court(courtNumber, surfaceMaterial, address, postalCode) VALUES (1, 'Cement', '540 Court Rd', 'V2BLO1');
INSERT INTO Court(courtNumber, surfaceMaterial, address, postalCode) VALUES (1, 'Asphalt', '752 Racket St', 'V1PL77');

INSERT INTO Picture (pictureSrc, altDescription) VALUES ('Raquets', 'Raquets');
INSERT INTO Picture (pictureSrc, altDescription) VALUES ('Courts', 'Courts');
INSERT INTO Picture (pictureSrc, altDescription) VALUES ('Pickleballs', 'Pickleballs');
INSERT INTO Picture (pictureSrc, altDescription) VALUES ('Outdoor Courts', 'Outdoor Courts');
INSERT INTO Picture (pictureSrc, altDescription) VALUES ('Pickleball Game', 'Pickleball Game');

INSERT INTO UserLocation (address, province, city, postalCode) VALUES ('111 Apple St', 'BC', 'Vancouver', 'V12NOP');
INSERT INTO UserLocation (address, province, city, postalCode) VALUES ('111 Lime St', 'BC', 'Vancouver', 'V15TBH');
INSERT INTO UserLocation (address, province, city, postalCode) VALUES ('111 Banana St', 'BC', 'Vancouver', 'V63PLE');
INSERT INTO UserLocation (address, province, city, postalCode) VALUES ('111 Blueberry St', 'BC', 'Vancouver', 'V90MN1');
INSERT INTO UserLocation (address, province, city, postalCode) VALUES ('111 Grape St', 'BC', 'Vancouver', 'VT1GH4');
INSERT INTO UserLocation (address, province, city, postalCode) VALUES ('111 Apricot St', 'BC', 'Vancouver', 'V4E0B2');

INSERT INTO UserInfo (userID, email, password, firstName, lastName, profilePicture, address, province, city) VALUES (1, 'test1@gmail.com', 'apple', 'John', 'Smith', NULL, '111 Apple St', 'BC', 'Vancouver');
INSERT INTO UserInfo (userID, email, password, firstName, lastName, profilePicture, address, province, city) VALUES (2, 'test2@gmail.com', 'lime', 'Joe', 'Smith', NULL, '111 Lime St', 'BC', 'Vancouver');
INSERT INTO UserInfo (userID, email, password, firstName, lastName, profilePicture, address, province, city) VALUES (3, 'test3@gmail.com', 'banana', 'Jane', 'Doe', NULL, '111 Banana St', 'BC', 'Vancouver');
INSERT INTO UserInfo (userID, email, password, firstName, lastName, profilePicture, address, province, city) VALUES (4, 'test4@gmail.com', 'blueberry', 'Lance', 'Jones', NULL, '111 Blueberry St', 'BC', 'Vancouver');
INSERT INTO UserInfo (userID, email, password, firstName, lastName, profilePicture, address, province, city) VALUES (5, 'test5@gmail.com', 'grape', 'Aria', 'Bell', NULL, '111 Grape St', 'BC', 'Vancouver');
INSERT INTO UserInfo (userID, email, password, firstName, lastName, profilePicture, address, province, city) VALUES (6, 'test6@gmail.com', 'apricot', 'Peter', 'Cho', NULL, '111 Apricot St', 'BC', 'Vancouver');

INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (1, 'Game 1', NULL, 'Raquets', 1);
INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (1, 'Game 2', NULL, 'Courts', 1);
INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (0, 'Game 3', 'New Pickleball Game', 'Pickleballs', 2);
INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (1, 'Game 4', NULL, 'Outdoor Courts', 3);
INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (0, 'Game 5', 'Hiya', 'Pickleball Game', 6);
INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (1, 'Game 6', NULL, NULL, 1);
INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (1, 'Game 7', NULL, NULL, 1);
INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (0, 'Game 8', 'New Pickleball Game', NULL, 2);
INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (1, 'Game 9', NULL, NULL, 3);
INSERT INTO GameInvite (status, title, description, thumbnail, creator) VALUES (0, 'Game 10', 'Hello', NULL, 5);

INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/01 15:00', 'yyyy/mm/dd hh24:mi'), 1, '123 Sports Ave', 'V23AB1');
INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/02 15:00', 'yyyy/mm/dd hh24:mi'), 1, '123 Sports Ave', 'V23AB1');
INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/01 20:00', 'yyyy/mm/dd hh24:mi'), 1, '509 Pickle St', 'V21PL7');
INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/02 15:00', 'yyyy/mm/dd hh24:mi'), 1, '509 Pickle St', 'V21PL7');
INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/01 10:00', 'yyyy/mm/dd hh24:mi'), 1, '123 Ball Rd', 'VL920N');
INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/01 15:00', 'yyyy/mm/dd hh24:mi'), 1, '540 Court Rd', 'V2BLO1');
INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/02 10:00', 'yyyy/mm/dd hh24:mi'), 1, '540 Court Rd', 'V2BLO1');
INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/01 20:00', 'yyyy/mm/dd hh24:mi'), 1, '752 Racket St', 'V1PL77');
INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/02 15:00', 'yyyy/mm/dd hh24:mi'), 1, '752 Racket St', 'V1PL77');
INSERT INTO Reservation (bookingTime, courtNumber, address, postalCode) VALUES (TO_DATE('2025/11/02 10:00', 'yyyy/mm/dd hh24:mi'), 1, '123 Ball Rd', 'VL920N');

INSERT INTO Singles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (1, 1, 1, 2, 1);
INSERT INTO Singles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (2, 2, 5, 6, 1);
INSERT INTO Singles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (3, 3, 2, 3, 1);
INSERT INTO Singles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (4, 4, 1, 4, 1);
INSERT INTO Singles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (5, 5, 1, 5, 1);

INSERT INTO Doubles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (6, 6, 1, 2, 1);
INSERT INTO Doubles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (7, 7, 1, 3, 1);
INSERT INTO Doubles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (8, 8, 1, 4, 1);
INSERT INTO Doubles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (9, 9, 1, 5, 1);
INSERT INTO Doubles(reservationID, gameInviteID, currentlyEnrolled, capacity, isActive) VALUES (10, 10, 1, 6, 0);

INSERT INTO Comments (content, commentedBy) VALUES ('Hello', 1);
INSERT INTO Comments (content, commentedBy) VALUES ('Goodbye', 1);
INSERT INTO Comments (content, commentedBy) VALUES ('Yes', 3);
INSERT INTO Comments (content, commentedBy) VALUES ('No', 4);
INSERT INTO Comments (content, commentedBy) VALUES ('Apple', 2);
INSERT INTO Comments (content, commentedBy) VALUES ('Banana', 5);

INSERT INTO replyTo(parentID, replyID) VALUES (1, 2);
INSERT INTO replyTo(parentID, replyID) VALUES (1, 3);
INSERT INTO replyTo(parentID, replyID) VALUES (1, 4);
INSERT INTO replyTo(parentID, replyID) VALUES (1, 5);
INSERT INTO replyTo(parentID, replyID) VALUES (1, 6);

INSERT INTO commentedOn(commentID, inviteID) VALUES (1, 5);
INSERT INTO commentedOn(commentID, inviteID) VALUES (2, 3);
INSERT INTO commentedOn(commentID, inviteID) VALUES (3, 2);
INSERT INTO commentedOn(commentID, inviteID) VALUES (4, 2);
INSERT INTO commentedOn(commentID, inviteID) VALUES (5, 1);

INSERT INTO registers(userID, inviteID) VALUES (1, 3);
INSERT INTO registers(userID, inviteID) VALUES (1, 4);
INSERT INTO registers(userID, inviteID) VALUES (1, 5);
INSERT INTO registers(userID, inviteID) VALUES (1, 8);
INSERT INTO registers(userID, inviteID) VALUES (1, 9);
INSERT INTO registers(userID, inviteID) VALUES (1, 10);
INSERT INTO registers(userID, inviteID) VALUES (2, 2);
INSERT INTO registers(userID, inviteID) VALUES (3, 2);
INSERT INTO registers(userID, inviteID) VALUES (4, 2);
INSERT INTO registers(userID, inviteID) VALUES (5, 2);
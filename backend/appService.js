import oracledb from 'oracledb';
import loadEnvFile from './utils/envUtil.js';

const envVariables = loadEnvFile('./.env');

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: `${envVariables.ORACLE_USER}`,
    password: `${envVariables.ORACLE_PASS}`,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
export async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

export async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
export async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool 
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

export async function getOracleConnection() {
    let connection;
    try {
        return await oracledb.getConnection();
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
export async function getRegisteredGames(userID) {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                SELECT
                    gi.title,
                    p.pictureSrc,
                    p.altDescription,
                    l.address,
                    pl.province,
                    cl.city,
                    l.postalCode,
                    c.courtNumber,
                    c.surfaceMaterial,
                    res.bookingTime,
                    sg.isActive,
                    sg.gameID,
                    gi.status,
                    sg.currentlyEnrolled,
                    sg.capacity,
                    gi.description,
                    gi.inviteID,
                    gi.creator
                FROM
                    registers r
                JOIN
                    GameInvite gi ON r.inviteID = gi.inviteID
                LEFT JOIN
                    Picture p ON gi.thumbnail = p.pictureSrc
                JOIN (
                    SELECT
                        s.gameID,
                        s.isActive,
                        s.gameInviteID,
                        s.reservationID,
                        s.currentlyEnrolled,
                        s.capacity
                    FROM Singles s
                    UNION ALL
                    SELECT
                        d.gameID,
                        d.isActive,
                        d.gameInviteID,
                        d.reservationID,
                        d.currentlyEnrolled,
                        d.capacity
                    FROM Doubles d
                ) sg ON gi.inviteID = sg.gameInviteID
                LEFT JOIN
                    Reservation res ON sg.reservationID = res.reservationID
                LEFT JOIN
                    Court c ON res.courtNumber = c.courtNumber AND res.address = c.address AND res.postalCode = c.postalCode
                LEFT JOIN
                    Location l ON c.address = l.address AND c.postalCode = l.postalCode
                LEFT JOIN
                    ProvinceLocation pl ON l.postalCode = pl.postalCode
                LEFT JOIN
                    CityLocation cl ON l.postalCode = cl.postalCode
                WHERE
                    r.userID = :userID
                        AND
                    sg.isActive = 1
                `,
                [userID]
            );
            console.log("Query result:", result.rows);
            return result.rows;
        });
    } catch (error) {
        console.error("Error executing query in getUser:", error);
        throw new Error("Failed to fetch user");
    }
}

export async function getUser(email) {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                SELECT
                    u.userID,    
                    u.email,
                    u.password,
                    u.firstName,
                    u.lastName,
                    u.profilePicture,
                    u.address,
                    u.province,
                    u.city,
                    ul.postalCode
                FROM
                    UserInfo u
                JOIN
                    UserLocation ul ON u.address = ul.address
                    AND u.province = ul.province
                    AND u.city = ul.city
                WHERE
                    u.email = :email
                `,
                [email]
            );
            console.log("Query result:", result.rows);
            return result.rows;
        });
    } catch (error) {
        console.error("Error executing query in getUser:", error);
        throw new Error("Failed to fetch user");
    }
}

export async function getLocation(address, province, city) {
    try {

        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                SELECT
                    ul.address,
                    ul.province,
                    ul.city,
                    ul.postalCode
                FROM
                    UserLocation ul
                WHERE
                    ul.address = :address
                    AND ul.province = :province
                    AND ul.city = :city
                `,
                [address, province, city]
            );
            console.log("Query result:", result.rows);
            return result.rows;
        });
    } catch (error) {
        console.error("Error executing query in getUser:", error);
        throw new Error("Failed to fetch location");
    }
}

export async function getMaxId() {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                SELECT
                    MAX(u.userID) AS maxUserID
                FROM
                    UserInfo u
                `
            );
            // Assuming the query returns a single row with a single column
            const maxUserID = result.rows[0][0];
            console.log("Query result (Max User ID):", maxUserID);
            return maxUserID; // Can be a number or null
        });
    } catch (error) {
        console.error("Error executing query in getMaxId:", error);
        throw new Error("Failed to fetch userID");
    }
}



export async function createUser(userID, email, password, firstName, lastName, profilePicture, address, province, city) {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                INSERT INTO UserInfo (userID, email, password, firstName, lastName, profilePicture, address, province, city) VALUES (:userID, :email, :password, :firstName, :lastName, :profilePicture, :address, :province, :city)
                `,
                [userID, email, password, firstName, lastName, profilePicture, address, province, city],
                { autoCommit: true }
            );
            console.log("it works");
            return result.rowsAffected && result.rowsAffected > 0;
        });
    } catch (error) {
        console.error("Error executing query in createUser:", error);
        throw new Error("Failed to create userInfo");
    }
}

export async function createUserLocation(address, province, city, postalCode) {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                INSERT INTO UserLocation(address, province, city, postalCode) VALUES (:address, :province, :city, :postalCode)
                `,
                [address, province, city, postalCode],
                { autoCommit: true }
            );
            console.log("it works");
            return result.rowsAffected && result.rowsAffected > 0;
        });
    } catch (error) {
        console.error("Error executing query in createUserLocation:", error);
        throw error;
    }
}

export async function getAllRegUsers() {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                SELECT u.userID
                FROM UserInfo u
                WHERE NOT EXISTS (
                    SELECT g.inviteID
                    FROM GameInvite g
                    MINUS
                    SELECT r.inviteID
                    FROM registers r
                    WHERE r.userID = u.userID
                )
                `
            );
            console.log("Query Result", result.rows);
            return result.rows;
        })
    } catch (error) {
        console.error("Error fetching unregistered users", error);
        throw new Error("Failed to get unregistered users");
    }
}


export async function getCommentsByUser(userID) {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                SELECT
                    c.content AS "content",
                    u.firstName AS "firstName",
                    u.lastName AS "lastName",
                    u.email AS "email"
                FROM
                    Comments c
                INNER JOIN UserInfo u
                    ON c.commentedBy = u.userID
                WHERE
                    u.userID =: userID
                `,
                { userID: userID },
            );
            console.log("Query Result: ", result.rows);
            return result.rows;
        })
    } catch (error) {
        console.error("Error fetching unregistered users", error);
        throw new Error("Failed to get unregistered users");
    }
}

export async function getReservationByPostalCode() {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                SELECT
                    r.postalCode,
                    COUNT(*)
                FROM
                    Reservation r
                GROUP BY
                    r.postalCode
                `
            );
            console.log(result.rows);
            return result.rows;
        })
    } catch (error) {
        console.error("Error fetching number of reservations by postal code", error);
        throw new Error("Failed to number of reservations by postal code");
    }
}

export async function getUserCreateMultGame() {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                SELECT
                U.email,
                COUNT(*) AS num_invites
                FROM GameInvite G
                JOIN UserInfo U ON G.creator = U.userID
                GROUP BY U.email
                HAVING COUNT(*) > 1
                `
            );
            console.log(result.rows);
            return result.rows;
        })
    } catch (error) {
        console.error("Error fetching users who've created more than one game", error);
        throw new Error("Failed to fetch users who've created more than one game");
    }
}

export async function getUserRegMoreThanAvg() {
    try {
        return await withOracleDB(async (connection) => {
            const result = await connection.execute(
                `
                SELECT U.email AS "EMAIL", COUNT(R.inviteID)
                FROM UserInfo U
                JOIN registers R ON U.userID = R.userID
                GROUP BY U.email
                HAVING COUNT(R.inviteID) > (
                    SELECT AVG(reg_count) FROM (
                        SELECT COUNT(*) AS reg_count
                        FROM registers
                        GROUP BY userID
                    ) reg_counts
                )
                `
            );
            console.log(result.rows);
            return result.rows;
        });
    } catch (error) {
        console.error("Error fetching users who've registered more than average", error);
        throw new Error("Failed to fetch users who've registered more than average");
    }
}

export async function updateUserInfo(userID, email, password, firstName, lastName, profilePicture, address, province, city) {
    try {
      return await withOracleDB(async (connection) => {
        const result = await connection.execute(
          `
          UPDATE UserInfo
          SET email = :email, 
              password = :password,
              firstName = :firstName,
              lastName = :lastName,
              profilePicture = :profilePicture,
              address = :address,
              province = :province,
              city = :city
          WHERE userID = :userID
          `,
          {
            userID,        
            email,         
            password,      
            firstName,     
            lastName,      
            profilePicture,
            address,       
            province,      
            city           
        },
          { autoCommit: true }
        );
        console.log("successfully updated userinfo");
        return result.rowsAffected && result.rowsAffected > 0;
      });
    } catch (error) {
      console.error("Error executing query in updateUserInfo:", error);
      throw new Error("Failed to update userInfo");
    }
  }

  
  


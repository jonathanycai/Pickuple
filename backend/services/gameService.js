import { withOracleDB } from "../appService.js";
import { deleteGameInvite } from "./gameInviteService.js";
import { deleteReservation } from "./reservationService.js";

export async function createGame(connection, game, reservationID, inviteID) {
  const { capacity, type } = JSON.parse(game);
  try {
    let result;
    if (type === 'singles') {
      result = await connection.execute(
        `INSERT INTO SINGLES (reservationID, gameInviteID, currentlyEnrolled, capacity) 
        VALUES (:reservationID, :inviteId, 1, :capacity)`,
        {
          reservationID,
          inviteID,
          capacity,
        },
      );
    } else if (type === 'doubles') {
      result = await connection.execute(
        `INSERT INTO DOUBLES (reservationID, gameInviteID, currentlyEnrolled, capacity) 
        VALUES (:reservationID, :inviteId, 1, :capacity)`,
        {
          reservationID,
          inviteID,
          capacity,
        },
      );
    }
    if (result.rowsAffected && result.rowsAffected > 0) {
      return;
    } else {
      throw new Error('Game was not inserted');
    }
  } catch (err) {
    if (typeof err.code === 'string') {
      let message = "";
      switch (err.code) {
        case 'ORA-02290':
          message = "Please ensure Game capacity is at least 1."
          break;
        default:
          message = "An error occured while trying to create a new Game.";
      }
      throw new Error(message);
    }
    console.log(err);
    throw new Error("Failed to insert new Game.");
  };
}

export async function deleteGame(inviteID) {
  return await withOracleDB(async (connection) => {
    try {
      const resultReservationID = await connection.execute(
        `
          SELECT reservationID FROM Singles WHERE gameInviteID = :inviteID
          UNION
          SELECT reservationID FROM Doubles WHERE gameInviteID = :inviteID
        `,
        {
          inviteID,
        },
      );   
      if (resultReservationID.rows.length <= 0) {
        throw new Error("Game doesn't exist");
      }

      const singlesDelete = await connection.execute(
        `DELETE FROM Singles WHERE gameInviteID = :inviteID`,
        {
          inviteID,
        },
      );
      const doublesDelete = await connection.execute(
        `DELETE FROM Doubles WHERE gameInviteID = :inviteID`,
        {
          inviteID,
        },
      );    
      if (!((singlesDelete.rowsAffected && singlesDelete.rowsAffected > 0) || (doublesDelete.rowsAffected && doublesDelete.rowsAffected > 0))) {
        throw new Error("No Game to delete");
      } 

      const reservationID = resultReservationID.rows[0][0];
      await deleteReservation(connection, reservationID);

      await deleteGameInvite(connection, inviteID);

      await connection.commit();
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }     
  });
}

export async function getGamesToJoin(userID, clauses) {
  let filterClauses = "";
  for (let i = 0; i < clauses.length; i++) {
    filterClauses += " " + clauses[i];
  }
  try {
      return await withOracleDB(async (connection) => {
          const result = await connection.execute(
              `
              SELECT
                gi.inviteID,
                gi.status,
                gi.title,
                gi.creator,
                p.pictureSrc,
                p.altDescription,
                res.bookingTime,
                g.gameID,
                g.isActive,                
                g.currentlyEnrolled,
                g.capacity,
                c.courtNumber,
                c.surfaceMaterial,
                cm.type,
                l.address,
                l.postalCode,
                pl.province,
                cl.city                
              FROM
                GameInvite gi
              LEFT JOIN
                  Picture p ON gi.thumbnail = p.pictureSrc
              JOIN (
                  SELECT * FROM Singles s
                  UNION ALL
                  SELECT * FROM Doubles d
              ) g ON gi.inviteID = g.gameInviteID
              JOIN
                  Reservation res ON g.reservationID = res.reservationID
              JOIN
                  Court c ON res.courtNumber = c.courtNumber AND res.address = c.address AND res.postalCode = c.postalCode
              JOIN
                  CourtMaterial cm ON cm.surfaceMaterial = c.surfaceMaterial
              JOIN
                  Location l ON c.address = l.address AND c.postalCode = l.postalCode
              JOIN
                  ProvinceLocation pl ON l.postalCode = pl.postalCode
              JOIN
                  CityLocation cl ON l.postalCode = cl.postalCode
              WHERE 
                gi.inviteID NOT IN (SELECT r.inviteID FROM registers r WHERE r.userID = :userID)
                  AND
                gi.status = 1
                  AND
                res.bookingTime > SYSDATE
                  AND
                g.currentlyEnrolled < g.capacity ${filterClauses}
              `,
              {userID}
          );
          return result.rows;
      });
  } catch (error) {
      console.error("Error executing query to get Games to Join:", error);
      throw new Error("Failed to fetch games");
  }
}
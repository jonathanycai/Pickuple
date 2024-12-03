import oracledb from 'oracledb';
import { withOracleDB } from "../appService.js";
import { deletePicture } from './pictureService.js';

export async function createGameInvite(connection, gameInvite, thumbnail, userId) {
  const { title, description } = JSON.parse(gameInvite);
  try {
    const result = await connection.execute(
      `INSERT INTO GAMEINVITE (title, description, thumbnail, creator) 
      VALUES (:title, :description, :thumbnail, :userId)
      RETURNING inviteID INTO :id`,
      {
        title,
        description,
        thumbnail,
        userId,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );
    if (result.rowsAffected && result.rowsAffected > 0 && result.outBinds.id[0]) {
      return result.outBinds.id[0];
    } else {
      throw new Error('GameInvite was not inserted.');
    }
  } catch (err) {
    console.log(err);
    throw new Error("Failed to insert into GameInvite.");
  };
}

export async function getRegisteredUsers(body) {
  const {inviteId, checked} = body;
  const [projectionString, order] = createUserInfoProjectionString(checked);

  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `
        SELECT ${projectionString}
        FROM UserInfo NATURAL JOIN Registers
        WHERE inviteID = :inviteId
      `,
      [inviteId]
    );

    let returnData = []
    for (let i = 0; i < result.rows.length; i++) {
      const user = {}
      for (let j = 0; j < order.length; j++) {
        user[order[j]] = result.rows[i][j]
      }
      returnData.push(user);
    }
      
    return returnData;
  }).catch(() => {
      return [];
  });
}

function createUserInfoProjectionString(checked) {
  let retStr = "";
  let order = []
  if (checked.firstName) {
    retStr += "firstName, "
    order.push('firstName');
  }
  if (checked.lastName) {
    retStr += "lastName, "
    order.push('lastName');
  }
  if (checked.profile) {
    retStr += "profilePicture, "
    order.push('profile');
  }
  if (checked.userID) {
    retStr += "userID, "
    order.push('userID');
  }
  if (checked.email) {
    retStr += "email, "
    order.push('email');
  }
  if (checked.address) {
    retStr += "address, "
    order.push('address');
  }
  if (checked.province) {
    retStr += "province, "
    order.push('province');
  }
  if (checked.city) {
    retStr += "city, "
    order.push('city');
  }
  return [retStr.substring(0, retStr.length - 2), order];
}

export async function getComments(inviteId) {
  return await withOracleDB(async (connection) => {
      const result = await connection.execute(
        `
          SELECT u.firstName, u.lastName, c.commentID, c.content, c.commentedBy
          FROM 
            UserInfo u 
          INNER JOIN 
            Comments c ON c.commentedBy = u.userID
          INNER JOIN 
            CommentedOn co ON c.commentID = co.commentID
          WHERE co.inviteID = :inviteId AND
          NOT EXISTS (
            SELECT *
            FROM ReplyTo r
            WHERE r.replyID = c.commentID
          )
        `,
        [inviteId]
      );
      return result.rows;
  }).catch(() => {
      return [];
  });
}

export async function getReplies(commentID) {
  return await withOracleDB(async (connection) => {
      const result = await connection.execute(
        `
          SELECT u.firstName, u.lastName, c.commentID, c.content, c.commentedBy
          FROM 
            UserInfo u 
          INNER JOIN 
            Comments c ON c.commentedBy = u.userID
          INNER JOIN 
            ReplyTo r ON c.commentID = r.replyID
          WHERE r.parentID = :commentID
        `,
        [commentID]
      );
      return result.rows;
  }).catch(() => {
      return [];
  });
}

export async function createComment(content, commenter, inviteID, parentID) {
  return await withOracleDB(async (connection) => {
    try {
      const commentResult = await connection.execute(
        `
          INSERT INTO Comments(content, commentedBy) VALUES(:content, :commenter)
          RETURNING commentID INTO :id
        `,
        {
          content,
          commenter,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      if (!commentResult.rowsAffected || commentResult.rowsAffected < 0 || !commentResult.outBinds.id[0]) {
          return false;
      }

      const id = commentResult.outBinds.id[0];

      if (parentID) {
        const replyResult = await connection.execute(
          `
            INSERT INTO ReplyTo(parentID, replyID) VALUES(:parentID, :id)
          `,
          [parentID, id]
        )
        if (!replyResult.rowsAffected || replyResult.rowsAffected < 0) {
          return false;
        }
      }

      const commentedOnResult = await connection.execute(
        `
          INSERT INTO CommentedOn(commentID, inviteID) VALUES(:id, :inviteID)
        `,
        [id, inviteID],
      )
      if (commentedOnResult.rowsAffected && commentedOnResult.rowsAffected > 0) {
        await connection.commit();
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  })
}

export async function deleteComment(commentID) {
  return await withOracleDB(async (connection) => {
      const result = await connection.execute(
        `
          DELETE FROM Comments WHERE commentID = :commentID
          OR commentID IN (
            SELECT replyID
            FROM ReplyTo
            WHERE parentID = :commentID
          )
        `,
        {
          commentID: commentID
        },
        { autoCommit: true }
      );
      if (result.rowsAffected && result.rowsAffected > 0) {
        return true;
      } else {
        return false;
      }
  }).catch((err) => {
      console.log(err);
      return false;
  });
}

export async function deleteGameInvite(connection, inviteID) {
  const resultThumbnail = await connection.execute(
    `SELECT thumbnail FROM GameInvite WHERE inviteID = :inviteID`,
    {
      inviteID,
    },
  );
  if (resultThumbnail.rows.length == 0) {
    throw new Error("GameInvite doesn't exist");
  }

  const resultCommentIds = await connection.execute(
    `SELECT commentID FROM CommentedOn WHERE inviteID = :inviteID`,
    {
      inviteID,
    },
  )
  
  const result = await connection.execute(
    `DELETE FROM GameInvite WHERE inviteID = :inviteID`,
    {
      inviteID,
    },
  );   
  if (!(result.rowsAffected && result.rowsAffected > 0)) {
    throw new Error("GameInvite failed to delete");
  }

  const thumbnail = resultThumbnail.rows[0][0];
  if (thumbnail) {
    await deletePicture(connection, thumbnail);
  }

  const commentIds = resultCommentIds.rows;
  if (commentIds.length > 0) {
    await deleteComments(connection, commentIds);
  }
}

export async function deleteComments(connection, commentIds) {
  const inArray = commentIds.join(', ');
  const result = await connection.execute(
    `DELETE FROM Comments WHERE commentID IN (${inArray})`
  );
  if (!(result.rowsAffected && result.rowsAffected > 0)) {
    throw new Error("Comments failed to delete");
  }
}

export async function registerForGame(userID, inviteID) {
  return await withOracleDB(async (connection) => {
    try {
      const registersResult = await connection.execute(
        `INSERT INTO Registers VALUES(:userID, :inviteID)`,
        {
          userID,
          inviteID
        },
      );
      if (!registersResult.rowsAffected || registersResult.rowsAffected < 0) {
          return false;
      }

      const singlesResult = await connection.execute(
        `UPDATE Singles SET currentlyEnrolled = currentlyEnrolled + 1 WHERE gameInviteID = :inviteID`,
        {inviteID},
      )
      const doublesResult = await connection.execute(
        `UPDATE Doubles SET currentlyEnrolled = currentlyEnrolled + 1 WHERE gameInviteID = :inviteID`,
        {inviteID},
      )
      if ((singlesResult.rowsAffected && singlesResult.rowsAffected > 0) || 
            (doublesResult.rowsAffected && doublesResult.rowsAffected > 0)) {
        await connection.commit();
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  })
}

export async function getPastGames(userID) {
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
                  sg.isActive = 0
              `,
              [userID]
          );
          console.log("Query result:", result.rows);
          return result.rows;
      });
  } catch (error) {
      console.error("Error executing query in getPastGames:", error);
      throw new Error("Failed to fetch user");
  }
}

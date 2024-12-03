import oracledb from 'oracledb';

export async function createReservation(connection, datetime, location) {
  const { address, postalCode, courtNumber } = JSON.parse(location);
  try {
    const result = await connection.execute(
      `INSERT INTO RESERVATION (bookingTime, courtNumber, address, postalCode) 
      VALUES (TO_DATE(:datetime, 'yyyy-mm-dd hh24:mi'), :courtNumber, :address, :postalCode)
      RETURNING reservationID INTO :id`,
      {
        datetime,
        courtNumber,
        address,
        postalCode,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );
    if (result.rowsAffected && result.rowsAffected > 0 && result.outBinds.id[0]) {
      return result.outBinds.id[0];
    } else {
      throw new Error('reservation was not inserted');
    }
  } catch (err) {
    if (typeof err.code === 'string') {
      let message = ""
      switch (err.code) {
        case 'ORA-00001':
          message = "Court already booked at given time.";
          break;
        case 'ORA-20001':
          message = 'BookingTime conflicts with an existing reservation.';
          break;
        case 'ORA-20002':
          message = 'Cannot book for a past date. Please book a different time.';
          break;
        default:
          message = "An error occured while trying to create a new Reservation.";
      }
      throw new Error(message)
    }
    throw new Error("Failed to insert new Reservation.");
  };
}

export async function deleteReservation(connection, reservationID) {
  const result = await connection.execute(
    `DELETE FROM Reservation WHERE reservationID = :reservationID`,
    {
      reservationID,
    },
  );   
  if (!(result.rowsAffected && result.rowsAffected > 0)) {
    throw new Error("No Reservation to delete");
  }
}
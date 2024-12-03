import { useState } from "react";

interface Comment {
  [key: string]: string | number | null; // Adjust the value type based on your actual API response
}

interface User {
  [key: string]: string | number | null;
}

interface ReservationCount {
  POSTALCODE: string;
  COUNT: number;
}

interface UserGameCount {
  FIRSTNAME: string;
  LASTNAME: string;
  EMAIL: string;
  NUM_INVITES: number;
}

interface UserRegistrationCount {
  EMAIL: string;
  NUM_REGISTRATIONS: number;
}

interface ApiResponse {
  success: boolean;
  comments?: Comment[];
  registeredAllGamesUsers?: User[];
  reservations?: ReservationCount[];
  users?: UserGameCount[] | UserRegistrationCount[];
  message?: string;
}

export function AdminPage() {
  const [userID, setUserID] = useState<string>("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [registeredAllGamesUsers, setRegisteredAllGamesUsers] = useState<User[]>([]);
  const [reservationCounts, setReservationCounts] = useState<ReservationCount[]>([]);
  const [userGameCounts, setUserGameCounts] = useState<UserGameCount[]>([]);
  const [userRegistrationCounts, setUserRegistrationCounts] = useState<UserRegistrationCount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [usersErrorMessage, setUsersErrorMessage] = useState<string>("");
  const [reservationErrorMessage, setReservationErrorMessage] = useState<string>("");
  const [userGameErrorMessage, setUserGameErrorMessage] = useState<string>("");
  const [userRegErrorMessage, setUserRegErrorMessage] = useState<string>("");
  const port = process.env.NEXT_PUBLIC_PORT || "3000";

  const handleFetchComments = async () => {
    const trimmedUserID = userID.trim();

    if (trimmedUserID === "") {
      setErrorMessage("Please enter a userID.");
      setComments([]);
      return;
    }

    if (!/^\d+$/.test(trimmedUserID)) {
      setErrorMessage("Invalid userID. Please enter a valid number.");
      setComments([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:${port}/get-comments-by-user?userID=${userID}`);

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.comments && data.comments.length > 0) {
          setComments(data.comments);
          setErrorMessage("");
        } else {
          setComments([]);
          setErrorMessage("No comments found for this user.");
        }
      } else if (response.status === 404) {
        setComments([]);
        setErrorMessage("No comments found for this user.");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch comments.");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
      setErrorMessage("An error occurred while fetching comments.");
    }
  };

  const handleFetchRegisteredAllUsers = async () => {
    try {
      const response = await fetch(`http://localhost:${port}/get-all-registered-users`);

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.registeredAllGamesUsers && data.registeredAllGamesUsers.length > 0) {
          setRegisteredAllGamesUsers(data.registeredAllGamesUsers);
          setUsersErrorMessage("");
        } else {
          setRegisteredAllGamesUsers([]);
          setUsersErrorMessage("No users registered to all games found.");
        }
      } else if (response.status === 404) {
        setRegisteredAllGamesUsers([]);
        setUsersErrorMessage("No users registered to all games found.");
      } else {
        const data = await response.json();
        throw new Error(data.message || "No users registered to all games found.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setRegisteredAllGamesUsers([]);
      setUsersErrorMessage("An error occurred while fetching users.");
    }
  };

  const handleFetchReservationCounts = async () => {
    try {
      const response = await fetch(`http://localhost:${port}/get-reservation-postalcode`);

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.reservations && data.reservations.length > 0) {
          setReservationCounts(data.reservations);
          setReservationErrorMessage("");
        } else {
          setReservationCounts([]);
          setReservationErrorMessage("No reservations found.");
        }
      } else if (response.status === 404) {
        setReservationCounts([]);
        setReservationErrorMessage("No reservations found.");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch reservation counts.");
      }
    } catch (error) {
      console.error("Error fetching reservation counts:", error);
      setReservationCounts([]);
      setReservationErrorMessage("An error occurred while fetching reservation counts.");
    }
  };

  const handleFetchUserGameCounts = async () => {
    try {
      const response = await fetch(`http://localhost:${port}/get-user-create-mult-games`);

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.users && data.users.length > 0) {
          setUserGameCounts(data.users as UserGameCount[]);
          setUserGameErrorMessage("");
        } else {
          setUserGameCounts([]);
          setUserGameErrorMessage("No users found.");
        }
      } else if (response.status === 404) {
        setUserGameCounts([]);
        setUserGameErrorMessage("No users found.");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch users.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUserGameCounts([]);
      setUserGameErrorMessage("An error occurred while fetching users.");
    }
  };

  const handleFetchUserRegistrationCounts = async () => {
    try {
      const response = await fetch(`http://localhost:${port}/get-user-reg-more-avg`);

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.users && data.users.length > 0) {
          setUserRegistrationCounts(data.users as UserRegistrationCount[]);
          setUserRegErrorMessage("");
        } else {
          setUserRegistrationCounts([]);
          setUserRegErrorMessage("No users found.");
        }
      } else if (response.status === 404) {
        setUserRegistrationCounts([]);
        setUserRegErrorMessage("No users found.");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch users.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUserRegistrationCounts([]);
      setUserRegErrorMessage("An error occurred while fetching users.");
    }
  };
    
  return (
    <div className="flex-1 flex flex-col items-center p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center w-full max-w-[100%] gap-8">
        <h1 className="text-4xl font-bold text-center mb-4">ADMIN</h1>
        <div className="flex flex-col items-center w-full max-w-md gap-4">
          <h2 className="text-2xl font-semibold text-center">View comments by userID</h2>
          <input
            type="number"
            placeholder="Enter userID"
            value={userID}
            onChange={(e) => setUserID(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring focus:ring-blue-300"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFetchComments();
              }
            }}
          />
          <button
            onClick={handleFetchComments}
            className="mt-2 px-4 py-2 border border-white text-white bg-black rounded-md hover:bg-opacity-80 transition duration-200"
          >
            Fetch Comments
          </button>
        </div>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {comments.length > 0 && (
          <table className="w-full max-w-md border-collapse border border-gray-300 mt-4">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Content</th>
                <th className="border border-gray-300 px-4 py-2">First Name</th>
                <th className="border border-gray-300 px-4 py-2">Last Name</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment, index) => (
                <tr key={index}>
                  {Object.values(comment).map((value, idx) => (
                    <td key={idx} className="border border-gray-300 px-4 py-2">
                      {value !== null ? value.toString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="text-2xl font-semibold text-center mt-8">
          Get Users That Are Registered to All Games
        </h2>
        <button
          onClick={handleFetchRegisteredAllUsers}
          className="mt-2 px-4 py-2 border border-white text-white bg-black rounded-md hover:bg-opacity-80 transition duration-200"
        >
          Fetch Unregistered Users
        </button>
        {usersErrorMessage && <p className="text-red-500">{usersErrorMessage}</p>}
        {registeredAllGamesUsers.length > 0 && (
          <table className="w-full max-w-md border-collapse border border-gray-300 mt-4">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">UserID</th>
              </tr>
            </thead>
            <tbody>
              {registeredAllGamesUsers.map((user, index) => (
                <tr key={index}>
                  {Object.values(user).map((value, idx) => (
                    <td key={idx} className="border border-gray-300 px-4 py-2">
                      {value !== null ? value.toString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="text-2xl font-semibold text-center mt-8">
          Get Number of Reservations by Postal Code
        </h2>
        <button
          onClick={handleFetchReservationCounts}
          className="mt-2 px-4 py-2 border border-white text-white bg-black rounded-md hover:bg-opacity-80 transition duration-200"
        >
          Fetch Reservation Counts
        </button>
        {reservationErrorMessage && <p className="text-red-500">{reservationErrorMessage}</p>}
        {reservationCounts.length > 0 && (
          <table className="w-full max-w-md border-collapse border border-gray-300 mt-4">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Postal Code</th>
                <th className="border border-gray-300 px-4 py-2">Number of Reservations</th>
              </tr>
            </thead>
            <tbody>
              {reservationCounts.map((reservation, index) => (
                <tr key={index}>
                  {Object.values(reservation).map((value, idx) => (
                    <td key={idx} className="border border-gray-300 px-4 py-2">
                      {value !== null ? value.toString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="text-2xl font-semibold text-center mt-8">
          Get Users Who've Created More Than One Game
        </h2>
        <button
          onClick={handleFetchUserGameCounts}
          className="mt-2 px-4 py-2 border border-white text-white bg-black rounded-md hover:bg-opacity-80 transition duration-200"
        >
          Fetch Users
        </button>
        {userGameErrorMessage && <p className="text-red-500">{userGameErrorMessage}</p>}
        {userGameCounts.length > 0 && (
          <table className="w-full max-w-md border-collapse border border-gray-300 mt-4">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Number of Invites</th>
              </tr>
            </thead>
            <tbody>
              {userGameCounts.map((user, index) => (
                <tr key={index}>
                  {Object.values(user).map((value, idx) => (
                    <td key={idx} className="border border-gray-300 px-4 py-2">
                      {value !== null ? value.toString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="text-2xl font-semibold text-center mt-8">
          Get Users Who Registered for More Than the Average Number of Games
        </h2>
        <button
          onClick={handleFetchUserRegistrationCounts}
          className="mt-2 px-4 py-2 border border-white text-white bg-black rounded-md hover:bg-opacity-80 transition duration-200"
        >
          Fetch Users
        </button>
        {userRegErrorMessage && <p className="text-red-500">{userRegErrorMessage}</p>}
        {userRegistrationCounts.length > 0 && (
          <table className="w-full max-w-md border-collapse border border-gray-300 mt-4">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Number of Registrations</th>
              </tr>
            </thead>
            <tbody>
              {userRegistrationCounts.map((user, index) => (
                <tr key={index}>
                  {Object.values(user).map((value, idx) => (
                    <td key={idx} className="border border-gray-300 px-4 py-2">
                      {value !== null ? value.toString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
        
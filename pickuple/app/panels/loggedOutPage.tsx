"use client";

import { useState } from "react";
import { useUserContext } from "../GlobalContext";

interface LoggedOutPageProps {
  loggedIn: boolean;
  setLoggedIn: (logIn: boolean) => void;
}

export function LoggedOutPage({ loggedIn, setLoggedIn }: LoggedOutPageProps) {
  // States for the input fields
  const [localEmail, setLocalEmail] = useState<string>("");
  const [localPassword, setLocalPassword] = useState<string>("");
  const [localFirstName, setLocalFirstName] = useState<string>("");
  const [localLastName, setLocalLastName] = useState<string>("");
  const [localAddress, setLocalAddress] = useState<string>("");
  const [localProvince, setLocalProvince] = useState<string>("");
  const [localCity, setLocalCity] = useState<string>("");
  const [localPostalCode, setLocalPostalCode] = useState<string>("");
  const [localProfilePicture, setLocalProfilePicture] = useState<string>("");

  // Global Context Info
  const {
    userID,
    setUserID,
    email,
    setEmail,
    password,
    setPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    profilePicture,
    setProfilePicture,
    address,
    setAddress,
    province,
    setProvince,
    city,
    setCity,
    postalCode,
    setPostalCode,
  } = useUserContext();

  // Other states
  const [error, setError] = useState<string | null>(null);
  const [showInputs, setShowInputs] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const port = process.env.NEXT_PUBLIC_PORT || "3000";

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const isLoginValid = (): boolean => {
    return localEmail.trim() !== "" && localPassword.trim() !== "";
  };

  const isRegistrationValid = (): boolean => {
    return (
      localEmail.trim() !== "" &&
      localPassword.trim() !== "" &&
      localFirstName.trim() !== "" &&
      localLastName.trim() !== "" &&
      localAddress.trim() !== "" &&
      localProvince.trim() !== "" &&
      localCity.trim() !== "" &&
      localPostalCode.trim() !== ""
    );
  };

  // Login handler
  const handleLogin = async () => {
    try {
      setError(null);

      const trimmedEmail = localEmail.trim();
      const trimmedPassword = localPassword.trim();

      if (trimmedEmail === "" || trimmedPassword === "") {
        setError("Please enter both Email and Password.");
        return;
      }

      if (!isValidEmail(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }

      const response = await fetch(
        `http://localhost:${port}/get-user?email=${encodeURIComponent(
          localEmail
        )}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Email or password is wrong.");
          return;
        }
        throw new Error("Unexpected error");
      }

      const queryResult = await response.json();
      const user = queryResult.user;

      if (!user || user.length === 0) {
        setError("Email or password is wrong.");
        return;
      }

      const [
        userID,
        userEmail,
        userPassword,
        userFirstName,
        userLastName,
        userProfilePicture,
        userAddress,
        userProvince,
        userCity,
        userPostalCode,
      ] = user[0];

      if (userPassword !== localPassword) {
        setError("Email or password is wrong.");
        return;
      }

      // Updating Global Context on succesful login
      setUserID(userID);
      setEmail(userEmail);
      setPassword(userPassword);
      setFirstName(userFirstName);
      setLastName(userLastName);
      setProfilePicture(userProfilePicture);
      setAddress(userAddress);
      setProvince(userProvince);
      setCity(userCity);
      setPostalCode(userPostalCode);
      console.log(email);

      setLoggedIn(true);
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
      console.error(err);
    }
  };

  // Registration/Submit handler
  const handleSubmit = async () => {
    try {
      setError(null);

      const trimmedEmail = localEmail.trim();
      const trimmedPassword = localPassword.trim();
      const trimmedFirstName = localFirstName.trim();
      const trimmedLastName = localLastName.trim();
      const trimmedAddress = localAddress.trim();
      const trimmedProvince = localProvince.trim();
      const trimmedCity = localCity.trim();
      const trimmedPostalCode = localPostalCode.trim();
      const trimmedProfilePicture = localProfilePicture.trim();

      if (
        trimmedEmail === "" ||
        trimmedPassword === "" ||
        trimmedFirstName === "" ||
        trimmedLastName === "" ||
        trimmedAddress === "" ||
        trimmedProvince === "" ||
        trimmedCity === "" ||
        trimmedPostalCode === ""
      ) {
        setError("Please fill in all the boxes.");
        return;
      }

      if (!isValidEmail(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }

      // Check if the email already exists
      const userCheckResponse = await fetch(
        `http://localhost:${port}/get-user?email=${encodeURIComponent(
          localEmail
        )}`
      );

      // If the response is not 404, it means the email already exists
      if (userCheckResponse.status !== 404) {
        setError("Email is already registered.");
        return;
      }

      // Fetch the next max userID
      const maxIdResponse = await fetch(`http://localhost:${port}/get-max-id`);
      if (!maxIdResponse.ok) {
        throw new Error("Error fetching the next max userID");
      }
      const maxIdResult = await maxIdResponse.json();
      const userID = maxIdResult.maxID; // Extract the next userID

      // Insert user's location into UserLocation
      const insertLocationResponse = await fetch(
        `http://localhost:${port}/insert-user-location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: localAddress,
            province: localProvince,
            city: localCity,
            postalCode: localPostalCode,
          }),
        }
      );

      if (!insertLocationResponse.ok) {
        if (insertLocationResponse.status === 409) {
          console.log(
            "Location already exists, proceeding with user insertion."
          );
        } else {
          setError("Unexpected Error Occured");
          return;
        }
      }

      // Insert user into UserInfo
      const insertUserResponse = await fetch(
        `http://localhost:${port}/insert-user-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID,
            email: localEmail,
            password: localPassword,
            firstName: localFirstName,
            lastName: localLastName,
            address: localAddress,
            province: localProvince,
            city: localCity,
            profilePicture: localProfilePicture,
          }),
        }
      );

      if (!insertUserResponse.ok) {
        setError("Error inserting user information");
        return;
      }

      // If all operations are successful, log in the user, and update Global Context
      setUserID(userID);
      setEmail(localEmail);
      setPassword(localPassword);
      setFirstName(localFirstName);
      setLastName(localLastName);
      setProfilePicture(localProfilePicture);
      setAddress(localAddress);
      setProvince(localProvince);
      setCity(localCity);
      setPostalCode(localPostalCode);

      setLoggedIn(true);
    } catch (err) {
      console.error("Error during registration:", err);
      setError("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <div className="flex-1 grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        {!showInputs ? (
          <div className="flex gap-4">
            <button
              className="px-6 py-2 border border-white text-white rounded-md bg-black hover:bg-gray-900 hover:border-gray-300 transition-all"
              onClick={() => {
                setShowInputs(true);
                setIsRegistering(false);
              }}
            >
              LOG IN
            </button>
            <button
              className="px-6 py-2 border border-white text-white rounded-md bg-black hover:bg-gray-900 hover:border-gray-300 transition-all"
              onClick={() => {
                setShowInputs(true);
                setIsRegistering(true);
              }}
            >
              REGISTER
            </button>
          </div>
        ) : isRegistering ? (
          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="password"
              placeholder="Password"
              value={localPassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="text"
              placeholder="First Name"
              value={localFirstName}
              onChange={(e) => setLocalFirstName(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={localLastName}
              onChange={(e) => setLocalLastName(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="text"
              placeholder="Address"
              value={localAddress}
              onChange={(e) => setLocalAddress(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="text"
              placeholder="Province"
              value={localProvince}
              onChange={(e) => setLocalProvince(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="text"
              placeholder="City"
              value={localCity}
              onChange={(e) => setLocalCity(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="text"
              placeholder="Postal Code"
              value={localPostalCode}
              onChange={(e) => setLocalPostalCode(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="url"
              placeholder="Profile Picture URL (optional)"
              value={localProfilePicture}
              onChange={(e) => setLocalProfilePicture(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <button
              className="px-6 py-2 border border-white text-white rounded-md bg-black hover:bg-gray-900 hover:border-gray-300 transition-all"
              onClick={handleSubmit}
            >
              SUBMIT
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="password"
              placeholder="Password"
              value={localPassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <button
              className="px-6 py-2 border border-white text-white rounded-md bg-black hover:bg-gray-900 hover:border-gray-300 transition-all"
              onClick={handleLogin}
            >
              SUBMIT
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

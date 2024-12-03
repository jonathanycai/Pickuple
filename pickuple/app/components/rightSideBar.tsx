"use client";

import { useEffect, useState } from "react";
import { Avatar } from "flowbite-react";
import { FaGear } from "react-icons/fa6";
import { Modal, Button, TextField, Typography } from "@mui/material";
import { useUserContext } from "../GlobalContext";
import styles from "./sidebar.module.css";
// import { createTheme, ThemeProvider } from "@mui/material/styles";

interface RightSideBarProps {
  loggedIn: boolean;
  setLoggedIn: (logIn: boolean) => void;
}

export function RightSidebar({ loggedIn, setLoggedIn }: RightSideBarProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const port = process.env.NEXT_PUBLIC_PORT || "3000";
  const [openUpdateResult, setOpenUpdateResult] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<[boolean, string] | []>(
    []
  );

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

  // States for the input fields
  const [localEmail, setLocalEmail] = useState<string>(email || "");
  const [localPassword, setLocalPassword] = useState<string>(password || "");
  const [localFirstName, setLocalFirstName] = useState<string>(firstName || "");
  const [localLastName, setLocalLastName] = useState<string>(lastName || "");
  const [localAddress, setLocalAddress] = useState<string>(address || "");
  const [localProvince, setLocalProvince] = useState<string>(province || "");
  const [localCity, setLocalCity] = useState<string>(city || "");
  const [localPostalCode, setLocalPostalCode] = useState<string>(
    postalCode || ""
  );
  const [localProfilePicture, setLocalProfilePicture] = useState<string>(
    profilePicture || ""
  );

  // Updates Fields whenever context changes, on log in for example
  useEffect(() => {
    setLocalEmail(email || "");
    setLocalPassword(password || "");
    setLocalFirstName(firstName || "");
    setLocalLastName(lastName || "");
    setLocalProfilePicture(profilePicture || "");
    setLocalAddress(address || "");
    setLocalProvince(province || "");
    setLocalCity(city || "");
    setLocalPostalCode(postalCode || "");
  }, [
    email,
    password,
    firstName,
    lastName,
    profilePicture,
    address,
    province,
    city,
    postalCode,
  ]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleLogOut = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setProfilePicture("");
    setAddress("");
    setProvince("");
    setCity("");
    setPostalCode("");
    setLoggedIn(false);
    setOpen(false);
    setUserID(null);
  };

  // Update Info Handler, issue with updating to old address
  const handleUpdate = async () => {
    try {
      setError(null);

      // Update Location, if Location is different
      if (
        localAddress != address ||
        localProvince != province ||
        localCity != city ||
        localPostalCode != postalCode
      ) {
        const checkLocationResponse = await fetch(
          `http://localhost:${port}/get-location?address=${encodeURIComponent(
            localAddress
          )}&province=${encodeURIComponent(
            localProvince
          )}&city=${encodeURIComponent(localCity)}`
        );

        if (!checkLocationResponse.ok && checkLocationResponse.status !== 404) {
          // If response is not OK and not a 404, it's an error
          throw new Error("Error checking user location");
        }

        if (checkLocationResponse.status === 404) {
          // If location is not found (404), insert the new location
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
            throw new Error("Error inserting user location");
          }
        }
      }

      // Update user info
      const updateUserResponse = await fetch(
        `http://localhost:${port}/update-user-info`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID,
            localEmail,
            localPassword,
            localFirstName,
            localLastName,
            localProfilePicture,
            localAddress,
            localProvince,
            localCity,
          }),
        }
      );

      if (!updateUserResponse.ok) {
        setError("Email address already taken.");
        return;
      }

      setUpdateMessage([
        true,
        "Your information has been successfully updated.",
      ]);
      setOpenUpdateResult(true);

      // Update Global Context on Successful Update
      setEmail(localEmail);
      setPassword(localPassword);
      setFirstName(localFirstName);
      setLastName(localLastName);
      setProfilePicture(localProfilePicture);
      setAddress(localAddress);
      setProvince(localProvince);
      setCity(localCity);
      setPostalCode(localPostalCode);
      setOpen(false);
    } catch (err) {
      console.error("Error during update:", err);
      setError("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <div className="flex flex-col h-screen px-4 py-6 border-l border-gray-600 justify-between items-end sticky top-0">
      <div className="flex flex-row-reverse gap-x-4 items-center">
        <Avatar
          onClick={handleOpen}
          placeholderInitials={`${firstName?.charAt(0) || ""}${
            lastName?.charAt(0) || ""
          }`}
          className={`text-white w-12 h-12 rounded-full cursor-pointer justify-center bg-gray-400 ${styles.avatar}`}
        />
        <div className="flex flex-col items-end">
          <p className="text-sm">
            {firstName} {lastName}
          </p>
        </div>
      </div>
      {loggedIn && (
        <div className="w-8 h-8 cursor-pointer" onClick={handleOpen}>
          <FaGear className="w-full h-full" />
        </div>
      )}
      <Modal open={open} onClose={handleClose}>
        <div className="flex flex-col delete-game-modal items-center gap-3">
          <h2 className="text-lg font-bold">Edit Profile</h2>
          <TextField
            label="Email"
            value={localEmail}
            onChange={(e) => setLocalEmail(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                className: "text-white",
              },
            }}
          />
          <TextField
            label="Password"
            type="password"
            value={localPassword}
            onChange={(e) => setLocalPassword(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                className: "text-white",
              },
            }}
          />
          <TextField
            label="First Name"
            value={localFirstName}
            onChange={(e) => setLocalFirstName(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                className: "text-white",
              },
            }}
          />
          <TextField
            label="Last Name"
            value={localLastName}
            onChange={(e) => setLocalLastName(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                className: "text-white",
              },
            }}
          />
          <TextField
            label="Profile Picture URL"
            value={localProfilePicture}
            onChange={(e) => setLocalProfilePicture(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                className: "text-white",
              },
            }}
          />
          <TextField
            label="Address"
            value={localAddress}
            onChange={(e) => setLocalAddress(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                className: "text-white",
              },
            }}
          />
          <TextField
            label="Province"
            value={localProvince}
            onChange={(e) => setLocalProvince(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                className: "text-white",
              },
            }}
          />
          <TextField
            label="City"
            value={localCity}
            onChange={(e) => setLocalCity(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                className: "text-white",
              },
            }}
          />
          <TextField
            label="Postal Code"
            value={localPostalCode}
            onChange={(e) => setLocalPostalCode(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                className: "text-white",
              },
            }}
          />
          <Button
            className="px-4 border-white text-white"
            variant="outlined"
            onClick={handleUpdate}
          >
            Update Account
          </Button>
          <Button
            className="px-4 border-white text-white"
            variant="outlined"
            onClick={handleLogOut}
          >
            Log Out
          </Button>
          <Button
            className="px-4 border-white text-white"
            variant="outlined"
            onClick={handleClose}
          >
            Close
          </Button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </Modal>
      <Modal open={openUpdateResult} onClose={() => setOpenUpdateResult(false)}>
        <div className="flex flex-col delete-game-modal items-center gap-3">
          <Typography
            variant="h6"
            className={`flex items-center ${
              updateMessage[0] ? "text-green-400" : "text-red-400"
            }`}
          >
            {updateMessage[1]}
          </Typography>
        </div>
      </Modal>
    </div>
  );
}

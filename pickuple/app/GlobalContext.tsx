import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the context type
interface UserContextType {
  userID: number | null; // Corrected type to `number | null`
  setUserID: (id: number | null) => void; // Corrected type to `number | null`
  email: string | null;
  setEmail: (email: string | null) => void;
  password: string | null;
  setPassword: (password: string | null) => void;
  firstName: string | null;
  setFirstName: (firstName: string | null) => void;
  lastName: string | null;
  setLastName: (lastName: string | null) => void;
  profilePicture: string | null;
  setProfilePicture: (profilePicture: string | null) => void;
  address: string | null;
  setAddress: (address: string | null) => void;
  province: string | null;
  setProvince: (province: string | null) => void;
  city: string | null;
  setCity: (city: string | null) => void;
  postalCode: string | null;
  setPostalCode: (postalCode: string | null) => void;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Hook to use the UserContext
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

// UserProvider component to wrap your app
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userID, setUserID] = useState<number | null>(null); // Corrected to `number | null`
  const [email, setEmail] = useState<string | null>("");
  const [password, setPassword] = useState<string | null>("");
  const [firstName, setFirstName] = useState<string | null>("");
  const [lastName, setLastName] = useState<string | null>("");
  const [profilePicture, setProfilePicture] = useState<string | null>("");
  const [address, setAddress] = useState<string | null>("");
  const [province, setProvince] = useState<string | null>("");
  const [city, setCity] = useState<string | null>("");
  const [postalCode, setPostalCode] = useState<string | null>("");

  return (
    <UserContext.Provider
      value={{
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

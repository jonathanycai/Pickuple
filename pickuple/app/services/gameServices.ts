import { AxiosResponse } from "axios";
import { CommentResponse, CreateCommentRequest, CreateGameResponse, Game, JoinableGame, ProjectionUserInfo, ProjectionUserInfoResponse } from "../utils/types";
import axiosInstance from "./axiosConfig";

const port = process.env.NEXT_PUBLIC_PORT

export const createGame = async (data: FormData): Promise<CreateGameResponse> => {
  try {
    const result = await axiosInstance.post(
      "/create-game",
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return result.data;
  } catch (error: any) {
    console.log(error.message);
    return error.response.data;
  }
};

export const getRegisteredUsers = async (inviteId: number, checked: ProjectionUserInfo): Promise<ProjectionUserInfoResponse[]> => {
  try {
    const result = await axiosInstance.post(
      "/get-registered",
      {
        inviteId,
        checked
      }
    );
    return result.data.users;
  } catch (error: any) {
    console.log(error.message);
    return error.response;
  }
};

export const getComments = async (inviteId: number): Promise<CommentResponse[]> => {
  try {
    const result = await axiosInstance.get("/get-comments/" + inviteId);
    return result.data.comments;
  } catch (error: any) {
    console.log(error.message);
    return error.response;
  }
};

export const getReplies = async (commentID: number): Promise<CommentResponse[]> => {
  try {
    const result = await axiosInstance.get("/get-replies/" + commentID);
    return result.data.replies;
  } catch (error: any) {
    console.log(error.message);
    return error.response;
  }
};

export const createComment = async (data: CreateCommentRequest): Promise<Boolean> => {
  try {
    const result = await axiosInstance.post(
      "/create-comment/",
      data
    );
    return result.data.success;
  } catch (error: any) {
    console.log(error.message);
    return error.response.data.success;
  }
};

export const deleteComment = async (commentId: number): Promise<Boolean> => {
  try {
    const result = await axiosInstance.delete("/delete-comment/" + commentId);
    return result.data.success;
  } catch (error: any) {
    console.log(error.message);
    return error.response.data.success;
  }
};

export const deleteGame = async (inviteID: number): Promise<Boolean> => {
  try {
    const result = await axiosInstance.delete("/delete-game/" + inviteID);
    return result.data.success;
  } catch (error: any) {
    console.log(error.message);
    return error.response.data.success;
  }
}

export const fetchRegisteredGames = async (userID: number) => {
  try {
    const response = await fetch(`http://localhost:${port}/registered-games?userID=${userID}`);

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error("Failed to fetch registered games");
    }
    const result = await response.json();

    const formattedGames: Game[] = result.games.map((game: any) => {
      const date = new Date(game[9]);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };

      const readableTime = date.toLocaleString("en-US", options);

      return ({
        title: game[0],
        pictureSrc: game[1],
        altDescription: game[2],
        address: game[3],
        province: game[4],
        city: game[5],
        postalCode: game[6],
        courtNumber: game[7],
        surfaceMaterial: game[8],
        bookingTime: readableTime,
        isActive: game[10],
        gameID: game[11],
        status: game[12],
        enrolled: game[13],
        capacity: game[14],
        description: game[15],
        inviteID: game[16],
        creator: game[17],
      })
    });

    return formattedGames;
  } catch (error) {
    console.error("Error fetching registered games:", error);
    return [];
  }
};

export const getJoinableGames = async (userID: number, clauses: string[]) => {
  try {
    const result = await axiosInstance.post("/get-joinable-games",
      {
        userID,
        clauses
      }
    );
    const formattedGames: JoinableGame[] = result.data.games.map((game: any) => {
      const date = new Date(game[6]);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };

      const readableTime = date.toLocaleString("en-US", options);

      return ({
        inviteID: game[0],
        status: game[1],
        title: game[2],
        creator: game[3],
        pictureSrc: game[4],
        altDescription: game[5],
        bookingTime: readableTime,
        gameID: game[7],
        isActive: game[8],
        enrolled: game[9],
        capacity: game[10],
        courtNumber: game[11],
        surfaceMaterial: game[12],
        courtType: game[13],
        address: game[14],
        postalCode: game[15],
        province: game[16],
        city: game[17],
      })
    });

    return formattedGames;
  } catch (error: any) {
    console.log(error.message);
    if (error.response.status === 404) {
      return [];
    }
    return error.response;
  }
};

export const joinGame = async (data: { userID: number, inviteID: number }) => {
  try {
    const result = await axiosInstance.post(
      "/register-for-game",
      data,
    );
    return result.data.success;
  } catch (error: any) {
    console.log(error.message);
    return error.response.data.success;
  }
}

export const getLocations = async () => {
  try {
    const result = await axiosInstance.get("/get-locations");
    return result;
  } catch (error: any) {
    console.log(error.message);
    return error.response;
  }
}

export const fetchGameHistory = async (userID: number) => {
  try {
    const response = await fetch(`http://localhost:${port}/get-game-history?userID=${userID}`);

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error("Failed to fetch past games");
    }
    const result = await response.json();

    const formattedGames: Game[] = result.games.map((game: any) => {
      const date = new Date(game[9]);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };

      const readableTime = date.toLocaleString("en-US", options);

      return ({
        title: game[0],
        pictureSrc: game[1],
        altDescription: game[2],
        address: game[3],
        province: game[4],
        city: game[5],
        postalCode: game[6],
        courtNumber: game[7],
        surfaceMaterial: game[8],
        bookingTime: readableTime,
        isActive: game[10],
        gameID: game[11],
        status: game[12],
        enrolled: game[13],
        capacity: game[14],
        description: game[15],
        inviteID: game[16],
        creator: game[17],
      })
    });

    return formattedGames;
  } catch (error) {
    console.error("Error fetching past games:", error);
    return [];
  }
};
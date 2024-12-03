export interface CreateGameInviteForm {
  location: {
    address: string,
    postalCode: string,
    courtNumber: string,
  },
  reservation: {
    date: {
      month: string,
      day: string,
      year: string
    },
    time: {
      hour: string,
      minute: string,
      ampm: string
    }
  },
  game: {
    capacity: string,
    type: string,
  },
  gameInvite: {
    title: string,
    description: string,
  },
  thumbnail: File | null,
}

export type CourtResponseObject = [number, string, string];

export interface Game {
  title: string;
  pictureSrc: string;
  altDescription: string;
  address: string;
  province: string;
  city: string;
  postalCode: string;
  courtNumber: string;
  surfaceMaterial: string;
  bookingTime: string;
  isActive: number;
  gameID: number;
  status: number;
  enrolled: number;
  capacity: number;
  description: string;
  inviteID: number;
  creator: number;
}

export interface CreateCommentRequest {
  content: string;
  userID: number;
  inviteID: number;
  parentID: number;
}

export type CommentResponse = [string, string, number, string, number];

export interface ProjectionUserInfo {
  userID: boolean,
  email: boolean,
  firstName: boolean,
  lastName: boolean,
  profile: boolean,
  address: boolean,
  province: boolean,
  city: boolean
}

export interface ProjectionUserInfoResponse {
  firstName?: string | null,
  lastName?: string | null,
  profile?: string | null,
  userID?: number | null,
  email?: string | null,
  address?: string | null,
  province?: string | null,
  city?: string | null,
  password?: string | null,
}

export interface JoinableGame {
  inviteID: number;
  status: number;
  title: string;
  creator: number;
  pictureSrc: string;
  altDescription: string;
  bookingTime: string;
  gameID: number;
  isActive: number;
  enrolled: number;
  capacity: number;
  courtNumber: string;
  surfaceMaterial: string;
  courtType: string;
  address: string;
  postalCode: string;
  province: string;
  city: string;
}

export interface Filters {
  addresses: string[],
  postalCodes: string[],
  cities: string[],
  provinces: string[],
}

export interface CreateGameResponse {
  success: boolean,
  message: string
}
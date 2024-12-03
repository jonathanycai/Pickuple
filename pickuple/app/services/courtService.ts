import { CourtResponseObject } from "../utils/types";
import axiosInstance from "./axiosConfig";

export const getCourts = async (): Promise<CourtResponseObject[]> => {
  try {
    const result = await axiosInstance.get("/get-courts");
    return result.data.courts;
  } catch (error: any) {
    console.log(error.message);
    return error.response;
  }
};
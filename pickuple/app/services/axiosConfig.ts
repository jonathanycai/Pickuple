import axios from "axios";

const port = process.env.NEXT_PUBLIC_PORT

const axiosInstance = axios.create({
  baseURL: "http://localhost:" + port,
});

export default axiosInstance;
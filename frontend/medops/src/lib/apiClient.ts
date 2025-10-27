// src/lib/apiClient.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1/api", // 👈 tu backend local
  withCredentials: true,
});

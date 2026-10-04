import axios from "axios";
import { readToken } from "./token";

export const http = axios.create({
  baseURL: "/api",
  timeout: 5_000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

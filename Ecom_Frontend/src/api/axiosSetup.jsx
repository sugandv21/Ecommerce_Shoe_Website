// src/api/axiosSetup.js
import axios from "axios";

export const API_ROOT = (import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

// send cookies for session auth
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_ROOT;

export default axios;

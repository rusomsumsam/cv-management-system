import axios from "axios";

const api = axios.create({
    baseURL: "https://cv-management-system-gqwa.onrender.com/api",
    withCredentials: true,
});

export default api;
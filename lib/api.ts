// lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}`, // Base URL for the API
  withCredentials: true, // Include cookies
});

export default api;
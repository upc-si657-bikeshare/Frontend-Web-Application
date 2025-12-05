import axios from 'axios';

const BASE_URL = 'https://marquerite-unimprovised-roselia.ngrok-free.dev';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

export default api;

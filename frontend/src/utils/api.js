
import axios from 'axios';

export const API = axios.create({
  baseURL: 'https://team-collaborations-backend.onrender.com',
  withCredentials: true,
});


// User auth
export const getCurrentUser = () => API.get('/auth/current_user');
console.log("Current_User: " , getCurrentUser);
export const logoutUser = () => API.get('/auth/logout');

// Rooms
export const createRoom = (name) => API.post('/rooms/create', { name });
export const getRooms = () => API.get('/rooms');
export const joinRoom = (roomId) => API.post('/rooms/join', { roomId });
export const deleteRoom = (roomId) => API.delete(`/rooms/${roomId}`);

// Boards
export const getBoards = (roomId) => API.get(`/rooms/${roomId}/boards`);
export const addBoard = (roomId, board) => API.post(`/rooms/${roomId}/boards`, board);
export const updateBoard = (roomId, boardId, data) => API.put(`/rooms/${roomId}/boards/${boardId}`, { data });
export const deleteBoard = (roomId, boardId) => API.delete(`/rooms/${roomId}/boards/${boardId}`);

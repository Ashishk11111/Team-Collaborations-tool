
import React, { useState, useEffect } from "react";
import {
  getCurrentUser,
  createRoom,
  getRooms,
  logoutUser,
  joinRoom,
  deleteRoom, // <-- make sure you have this API call
} from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser()
      .then(({ data }) => setUser(data))
      .catch(() => navigate("/login"));

    fetchRooms();
  }, []);

  const fetchRooms = () => {
    getRooms().then(({ data }) => setRooms(data));
  };

  const handleCreateRoom = async () => {
    if (!roomName) return alert("Enter room name");
    await createRoom(roomName);
    setRoomName("");
    fetchRooms();
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId) return alert("Enter room ID");
    try {
      await joinRoom(joinRoomId);
      navigate(`/room/${joinRoomId}`);
    } catch {
      alert("Failed to join room");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteRoom(roomId);
      alert("Room deleted successfully");
      fetchRooms();
    } catch (err) {
      console.error(err);
      alert("Failed to delete room");
    }
  };

  async function handleLogout() {
    try {
      await logoutUser();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  const openRoom = (id) => {
    navigate(`/room/${id}`);
  };

  if (!user) return <div className="text-center py-10 text-lg">Loading...</div>;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-50 overflow-hidden p-6">
      {/* Floating background circles */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-300 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-pink-300 rounded-full opacity-30 animate-pulse"></div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white shadow-2xl p-6 rounded-3xl transform transition-transform hover:scale-105 duration-500">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Welcome, <span className="text-indigo-600">{user.displayName}</span>
          </h2>
          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Create Room */}
        <div className="bg-white shadow-2xl p-6 rounded-3xl space-y-4 transform transition-transform hover:scale-105 duration-500">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-700">Create Room</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room Name"
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleCreateRoom}
              className="px-6 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors"
            >
              Create
            </button>
          </div>
        </div>

        {/* Join Room */}
        <div className="bg-white shadow-2xl p-6 rounded-3xl space-y-4 transform transition-transform hover:scale-105 duration-500">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-700">Join Room</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Room ID"
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleJoinRoom}
              className="px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        {/* Your Rooms */}
        <div className="bg-white shadow-2xl p-6 rounded-3xl space-y-4 transform transition-transform hover:scale-10 duration-500">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-700">Your Rooms</h3>
          {rooms.length > 0 ? (
            <ul className="space-y-3">
              {rooms.map((room) => (
                <li
                  key={room._id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3"
                >
                  <span className="text-gray-800 font-medium">
                    {room.name}{" "}
                    <span className="text-sm text-gray-500">(ID: {room._id})</span>
                  </span>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => openRoom(room._id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      Enter
                    </button>
                    {room.adminId === user.id && ( // only admin can delete
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No rooms available</p>
          )}
        </div>
      </div>
    </div>
  );
}

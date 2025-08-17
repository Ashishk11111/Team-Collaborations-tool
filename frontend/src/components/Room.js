

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import ChatBox from './ChatBox';
import WhiteBoard from './whiteboard.jsx';
import { getCurrentUser } from '../utils/api';

export default function Room() {
  const { roomId } = useParams();
  const [user, setUser] = useState(null);
  const socketRef = useRef(null); // useRef to keep socket stable

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data);

        if (!socketRef.current) {
          const s = io('https://team-collaborations-backend.onrender.com', { withCredentials: true });
          s.emit('join-room', { roomId });
          socketRef.current = s;
        }
      })
      .catch(() => window.location.href = '/login');

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  if (!user) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col bg-gradient-to-tr from-blue-50 via-indigo-50 to-purple-50">
      <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800 tracking-wide drop-shadow-md">
        Room: <span className="text-indigo-600">{roomId}</span>
      </h2>

      <div className="flex-1 gap-1 flex min-h-0">
      <div className="flex flex-col flex-grow basis-0 min-w-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg w-full h-full hover:shadow-indigo-300 transition-shadow duration-300">
        <WhiteBoard socket={socketRef.current} roomId={roomId} />
      </div>
        <div className="flex flex-col basis-0 bg-gradient-to-b from-indigo-100 to-indigo-200 border border-indigo-300 rounded-2xl shadow-inner min-w-[300px] h-full
          overflow-hidden w-1/5">
          {socketRef.current && <ChatBox socket={socketRef.current} roomId={roomId} user={user} />}
        </div> 


    </div>

    </div>
  );
}

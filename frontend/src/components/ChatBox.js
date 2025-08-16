// // import React, { useState, useEffect } from 'react';

// // export default function ChatBox({ socket, roomId, user }) {
// //   const [messages, setMessages] = useState([]);
// //   const [input, setInput] = useState('');

// //   useEffect(() => {
// //     if (!socket) return;

// //     socket.emit('joinRoom', roomId);

// //     socket.on('chatMessage', (msg) => {
// //       setMessages((prev) => [...prev, msg]);
// //     });

// //     return () => {
// //       socket.off('chatMessage');
// //     };
// //   }, [socket, roomId]);

// //   const sendMessage = () => {
// //     if (!input.trim()) return;
// //     socket.emit('chatMessage', { roomId, message: input, user });
// //     setInput('');
// //   };

// //   return (
// //     <div style={{ border: '1px solid black', padding: 10, maxHeight: 300, overflowY: 'scroll' }}>
// //       <h4>Chat</h4>
// //       <div style={{ minHeight: 200 }}>
// //         {messages.map((m, i) => (
// //           <div key={i}>
// //             <b>{m.user.displayName}:</b> {m.message}
// //           </div>
// //         ))}
// //       </div>
// //       <input
// //         value={input}
// //         onChange={(e) => setInput(e.target.value)}
// //         onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
// //         placeholder="Type a message"
// //         style={{ width: '80%' }}
// //       />
// //       <button onClick={sendMessage} style={{ width: '18%' }}>
// //         Send
// //       </button>
// //     </div>
// //   );
// // }


// import React, { useState, useEffect, useRef } from 'react';

// export default function ChatBox({ socket, roomId, user }) {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     if (!socket) return;

//     socket.emit('joinRoom', roomId);

//     socket.on('chatMessage', (msg) => {
//       setMessages((prev) => [...prev, msg]);
//     });

//     return () => {
//       socket.off('chatMessage');
//     };
//   }, [socket, roomId]);

//   // Scroll to bottom when messages update
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const sendMessage = () => {
//     if (!input.trim()) return;
//     socket.emit('chatMessage', { roomId, message: input, user });
    
//     setInput('');
//   };

//   return (
//     <div className="flex flex-col h-full border border-gray-200 rounded-2xl p-2 bg-gradient-to-br from-white via-blue-50 to-indigo-50 shadow-lg">

//       {/* Messages */}
//       <div
//         className="flex-grow overflow-y-auto mb-1 space-y-3 px-1 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent"
//         style={{ minHeight: '65vh' }} // Keep messages area tall
//       >
//         {messages.map((m, i) => (
//           <div
//             key={i}
//             className={`p-1.5 rounded-2xl shadow-sm max-w-[80%] break-words animate-fadeIn ${m.user?.id === user?.id
//                 ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white self-end ml-auto'
//                 : 'bg-gray-100 text-gray-800'
//               }`}
//           >
//             <span className="block text-xs font-semibold opacity-80">
//               {m.user?.displayName || 'Anon'}
//             </span>
//             <span>{m.message}</span>
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Compact Input area */}
//       <div className="flex gap-2 items-center mt-1">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
//           placeholder="Type a message..."
//           className="flex-grow text-sm rounded-full border border-gray-300 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
//         />
//         <button
//           onClick={sendMessage}
//           className="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow hover:opacity-90 transition-all"
//         >
//           Send
//         </button>
//       </div>
//     </div>


//   );
// }



// import React, { useState, useEffect, useRef } from 'react';

// export default function ChatBox({ socket, roomId, user }) {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     if (!socket || !roomId) return;

//     // Join room
//     socket.emit('joinRoom', roomId);

//     // Listen for messages
//     const handleMessage = (msg) => {
//       setMessages((prev) => [...prev, msg]);
//     };

//     socket.on('chatMessage', handleMessage);

//     // Cleanup
//     return () => {
//       socket.off('chatMessage', handleMessage);
//     };
//   }, [socket, roomId]);

//   // Auto-scroll
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const sendMessage = () => {
//     if (!input.trim() || !socket) return;

//     socket.emit('chatMessage', {
//       roomId,
//       message: input,
//       user,
//     });

//     setInput('');
//   };

//   return (
//     <div className="flex flex-col h-full border border-white/20 rounded-2xl p-3 bg-white/20 backdrop-blur-md shadow-2xl overflow-hidden">

//       {/* Messages */}
//       <div
//         className="flex-grow overflow-y-auto mb-1 space-y-3 px-2 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent"
//         style={{ minHeight: '65vh' }}
//       >
//         {messages.map((m, i) => (
//           <div
//             key={i}
//             className={`p-2 rounded-2xl shadow-sm max-w-[80%] break-words 
//               ${m.user?.id === user?.id
//                 ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white self-end ml-auto shadow-lg'
//                 : 'bg-white/30 text-gray-800 backdrop-blur-sm self-start shadow-inner'
//               }`}
//           >
//             <span className="block text-xs font-semibold opacity-70 mb-1">
//               {m.user?.displayName || 'Anon'}
//             </span>
//             <span className="text-sm">{m.message}</span>
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className="flex gap-2 items-center mt-2">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
//           placeholder="Type a message..."
//           className="flex-grow text-sm rounded-2xl border border-white/30 px-4 py-2 bg-white/30 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
//         />
//         <button
//           onClick={sendMessage}
//           className="px-4 py-2 text-sm rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:opacity-90 transition-all"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }












// import React, { useState, useEffect, useRef } from 'react';

// export default function ChatBox({ socket, roomId, user }) {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     if (!socket) return;

//     // Listen for chat messages
//     const handleMessage = (msg) => {
//       setMessages((prev) => [...prev, msg]);
//     };

//     socket.on('chatMessage', handleMessage);

//     return () => {
//       socket.off('chatMessage', handleMessage);
//     };
//   }, [socket]);

//   // Scroll to bottom when messages update
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const sendMessage = () => {
//     if (!input.trim()) return;

//     socket.emit('chatMessage', { roomId, message: input, user });
//     setInput('');
//   };

//   return (
//     <div className="flex flex-col h-full border border-white/20 rounded-2xl p-3 bg-white/20 backdrop-blur-md shadow-2xl overflow-hidden">

//       {/* Messages */}
//       <div
//         className="flex-grow overflow-y-auto mb-1 space-y-3 px-2 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent"
//         style={{ minHeight: '65vh' }}
//       >
//         {messages.map((m, i) => (
//           <div
//             key={i}
//             className={`p-2 rounded-2xl shadow-sm max-w-[80%] break-words 
//               ${m.user?.id === user?.id
//                 ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white self-end ml-auto shadow-lg'
//                 : 'bg-white/30 text-gray-800 backdrop-blur-sm self-start shadow-inner'
//               }`}
//           >
//             <span className="block text-xs font-semibold opacity-70 mb-1">
//               {m.user?.displayName || 'Anon'}
//             </span>
//             <span className="text-sm">{m.message}</span>
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className="flex gap-2 items-center mt-2">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
//           placeholder="Type a message..."
//           className="flex-grow text-sm rounded-2xl border border-white/30 px-4 py-2 bg-white/30 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
//         />
//         <button
//           onClick={sendMessage}
//           className="px-4 py-2 text-sm rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:opacity-90 transition-all"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }






import React, { useState, useEffect, useRef } from 'react';

export default function ChatBox({ socket, roomId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => setMessages(prev => [...prev, msg]);
    socket.on('chatMessage', handleMessage);

    return () => socket.off('chatMessage', handleMessage);
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('chatMessage', { roomId, message: input, user });
    setInput('');
  };

   const scrollContainerRef = useRef(null);

  // Helper: check if user is near bottom
  const isNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return false;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100; // 100px threshold
  };

  useEffect(() => {
    if (isNearBottom() && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (

    // working
    // <div className="flex flex-col border border-white/20 rounded-2xl p-3 bg-white/20 backdrop-blur-md shadow-2xl overflow-hidden">

    //   <div
    //     className="flex-1 overflow-y-auto mb-1 space-y-3 px-2 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent"
    //     style={{ minHeight: '65vh' }}
    //   >
    //     {messages.map((m, i) => (
    //       <div
    //         key={i}
    //         className={`p-2 rounded-2xl shadow-sm max-w-[80%] break-words 
    //           ${m.user?.id === user?.id
    //             ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white self-end ml-auto shadow-lg'
    //             : 'bg-white/30 text-gray-800 backdrop-blur-sm self-start shadow-inner'
    //           }`}
    //       >
    //         <span className="block text-xs font-semibold opacity-70 mb-1">
    //           {m.user?.displayName || 'Anon'}
    //         </span>
    //         <span className="text-sm">{m.message}</span>
    //       </div>
    //     ))}
    //     <div ref={messagesEndRef} />
    //   </div>

      

    //   <div className="flex gap-2 items-center mt-2">
    //     <input
    //       type="text"
    //       value={input}
    //       onChange={e => setInput(e.target.value)}
    //       onKeyDown={e => e.key === 'Enter' && sendMessage()}
    //       placeholder="Type a message..."
    //       className="flex-grow text-sm rounded-2xl border border-white/30 px-4 py-2 bg-white/30 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
    //     />
    //     <button
    //       onClick={sendMessage}
    //       className="px-4 py-2 text-sm rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:opacity-90 transition-all"
    //     >
    //       Send
    //     </button>
    //   </div>
    // </div>


//     <div className="flex flex-col h-full border border-white/20 rounded-2xl p-3 bg-white/20 backdrop-blur-md shadow-2xl overflow-hidden">

//   {/* Messages container with custom scrollbar */}
//   <div
//     className="flex-grow mb-1 space-y-3 px-2 chat-scroll"
//     style={{ minHeight: '65vh', overflowY: 'auto' }}
//   >
//     {messages.map((m, i) => (
//       <div
//         key={i}
//         className={`p-2 rounded-2xl shadow-sm max-w-[80%] break-words 
//           ${m.user?.id === user?.id
//             ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white self-end ml-auto shadow-lg'
//             : 'bg-white/30 text-gray-800 backdrop-blur-sm self-start shadow-inner'
//           }`}
//       >
//         <span className="block text-xs font-semibold opacity-70 mb-1">
//           {m.user?.displayName || 'Anon'}
//         </span>
//         <span className="text-sm">{m.message}</span>
//       </div>
//     ))}
//     <div ref={messagesEndRef} />
//   </div>

//   {/* Input area */}
//   <div className="flex gap-2 items-center mt-2">
//     <input
//       type="text"
//       value={input}
//       onChange={e => setInput(e.target.value)}
//       onKeyDown={e => e.key === 'Enter' && sendMessage()}
//       placeholder="Type a message..."
//       className="flex-grow text-sm rounded-2xl border border-white/30 px-4 py-2 bg-white/30 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
//     />
//     <button
//       onClick={sendMessage}
//       className="px-4 py-2 text-sm rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:opacity-90 transition-all"
//     >
//       Send
//     </button>
//   </div>
// </div>


<div className="flex flex-col h-[80vh] border border-gray-300 rounded-2xl p-3 bg-white shadow-2xl">
      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto mb-1 space-y-3 px-2 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-gray-100"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-2xl shadow-sm max-w-[80%] break-words 
              ${m.user?.id === user?.id
                ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white self-end ml-auto shadow-lg'
                : 'bg-gray-100 text-gray-800 self-start shadow-inner'
              }`}
          >
            <span className="block text-xs font-semibold opacity-70 mb-1">
              {m.user?.displayName || 'Anon'}
            </span>
            <span className="text-sm">{m.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-center mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-grow text-sm rounded-2xl border border-gray-300 px-4 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 text-sm rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:opacity-90 transition-all"
        >
          Send
        </button>
      </div>
    </div>






  );
}



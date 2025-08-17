
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
require('./passport-setup');

const Room = require('./models/Room'); // <-- your Room model

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://team-collaborations-tool-vive.vercel.app', // React frontend URL
    credentials: true,
  },
});

// ---------------- In-memory whiteboard state ----------------
// rooms: Map<roomId, { boards: Array<{id,name,dataPreview?}>, accessEnabled: boolean, adminSocketId: string|null }>
const rooms = new Map();

function getRoomState(roomId) {
  let state = rooms.get(roomId);
  if (!state) {
    state = { boards: [], accessEnabled: false, adminSocketId: null };
    rooms.set(roomId, state);
  }
  return state;
}

function makeId() {
  // simple unique id (no extra deps)
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
// ------------------------------------------------------------

// MongoDB (kept for your auth/other routes; boards NOT stored in DB by socket handlers)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Failed to connect to MongoDB:', err));

app.use(cors({
  origin: 'https://team-collaborations-tool-vive.vercel.app',
  credentials: true,
}));




app.use(express.json());

app.set('trust proxy', 1);
// create a session middleware instance so we can reuse it with socket.io
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'secretkey',
  resave: false,
  saveUninitialized: false,
   cookie: {
    secure: true,      // HTTPS required
    httpOnly: true,    // browser JS cannot access cookies
    sameSite: 'none',  // allow cross-site cookies (frontend ≠ backend)
  },
});
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);

// ----- Wire session middleware into socket.io so `socket.request.session` exists -----
const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
// -------------------------------------------------------------------------------------

// ---------------- Socket.IO handling ----------------
io.on('connection', (socket) => {
  // console.log('User connected:', socket.id);

  // Helper: safe async wrapper for join
socket.on('join-room', async ({ roomId }) => {
  try {
    socket.join(roomId);
    const state = getRoomState(roomId);

    // Get current user ID from Google auth session
    const userId = socket.request.session?.passport?.user || null;
    socket.data.userId = userId;
    console.log('userid : ', userId.id);
    // Fetch the room from MongoDB to know who is the admin
    const roomDoc = await Room.findById(roomId);
    if (!roomDoc) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    // Assign admin socket only if the user is the admin in DB
    if (roomDoc.adminId === userId.id) {
      state.adminSocketId = socket.id;
      socket.data.isAdmin = true;
    } else {
      socket.data.isAdmin = false;
    }

    socket.emit('init-boards', {
      boards: state.boards,
      accessEnabled: state.accessEnabled,
      isAdmin: socket.data.isAdmin,
    });

    console.log(`${socket.id} joined room ${roomId} (isAdmin=${socket.data.isAdmin}, userId=${userId})`);
  } catch (err) {
    console.error('Error in join-room:', err);
  }
});


  // Admin-only: create a board
  socket.on('create-board', ({ roomId, name } = {}) => {
    const state = getRoomState(roomId);
    if (state.adminSocketId !== socket.id) {
      socket.emit('action-denied', { reason: 'Only admin can create boards.' });
      return;
    }

    const board = { id: makeId(), name, dataPreview: '' };
    state.boards.push(board);
    io.to(roomId).emit('boards-list-updated', { boards: state.boards });
  });

  // Admin-only: delete board
  socket.on('delete-board', ({ roomId, boardId } = {}) => {
    const state = getRoomState(roomId);
    if (state.adminSocketId !== socket.id) {
      socket.emit('action-denied', { reason: 'Only admin can delete boards.' });
      return;
    }

    state.boards = state.boards.filter(b => b.id !== boardId);
    io.to(roomId).emit('boards-list-updated', { boards: state.boards });
  });

  // Admin-only: toggle edit access
  socket.on('set-access', ({ roomId, accessEnabled } = {}) => {
    const state = getRoomState(roomId);
    if (state.adminSocketId !== socket.id) {
      socket.emit('action-denied', { reason: 'Only admin can change access.' });
      return;
    }

    state.accessEnabled = !!accessEnabled;
    io.to(roomId).emit('access-changed', { accessEnabled: state.accessEnabled });
  });

  // Update a board (admin or accessEnabled)
  socket.on('update-board', ({ roomId, boardId, dataPreview } = {}) => {
    const state = getRoomState(roomId);
    if (state.adminSocketId !== socket.id && !state.accessEnabled) {
      socket.emit('action-denied', { reason: 'Edit access is disabled by admin.' });
      return;
    }

    const board = state.boards.find(b => b.id === boardId);
    if (!board) return;

    board.dataPreview = dataPreview;
    io.to(roomId).emit('board-updated', { boardId, dataPreview });
  });

  // Handle disconnect: optionally assign new admin
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    for (const [roomId, state] of rooms.entries()) {
      if (state.adminSocketId === socket.id) {
        const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        if (socketsInRoom.length > 0) {
          state.adminSocketId = socketsInRoom[0];
          io.to(roomId).emit('adminChanged', { newAdmin: state.adminSocketId });
          console.log(`New admin assigned for room ${roomId}: ${state.adminSocketId}`);
        } else {
          state.adminSocketId = null; // room empty
          console.log(`Room ${roomId} is empty, admin cleared.`);
        }
      }
    }
  });

  // payload: { roomId, message, user }
  socket.on('chatMessage', ({ roomId, message, user }) => {
    if (!roomId || !message || !user) return;
    io.to(roomId).emit('chatMessage', { message, user });
  });
});

// ---------------- Start server ----------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

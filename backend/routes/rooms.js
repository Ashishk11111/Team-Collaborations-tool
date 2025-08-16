const router = require('express').Router();
const Room = require('../models/Room');
const mongoose = require('mongoose'); 
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Not authenticated' });
}

// Create new room
router.post('/create', isAuthenticated, async (req, res) => {
  const { name } = req.body;
  const adminId = req.user.id;

  const room = new Room({
    name,
    adminId,
    members: [adminId],
  });

  await room.save();
  res.json(room);
});

// Get rooms where user is a member
router.get('/', isAuthenticated, async (req, res) => {
  const rooms = await Room.find({ members: req.user.id });
  res.json(rooms);
});

// Join room by ID
router.post('/join', isAuthenticated, async (req, res) => {
  const { roomId } = req.body;
  const userId = req.user.id;

  const room = await Room.findById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  if (!room.members.includes(userId)) {
    room.members.push(userId);
    await room.save();
  }

  res.json(room);
});


// DELETE /rooms/:roomId

router.delete('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;

    // Check if roomId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const currentUserId = req.session?.passport?.user;
    if (!currentUserId.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (room.adminId !== currentUserId.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Room.findByIdAndDelete(roomId);
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("Delete room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// GET all boards for a room
router.get('/:roomId/boards', isAuthenticated, async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room.boards); // return the boards array directly
});


// Add new board to a room
router.post('/:roomId/boards', isAuthenticated, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, data } = req.body; // optional data for blank or pre-filled board

    // Find the room
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Create new board subdocument
    const newBoard = {
      name: name || `Untitled ${room.boards.length + 1}`,
      data: data || '', // base64 or JSON
    };

    // Push to boards array
    room.boards.push(newBoard);

    // Save the room
    await room.save();

    // Return the newly created board (last element in the array)
    const createdBoard = room.boards[room.boards.length - 1];
    res.json(createdBoard); // contains _id automatically
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating board', error: err.message });
  }
});


// UPDATE board
router.put('/:roomId/boards/:boardId', isAuthenticated, async (req, res) => {
  const { roomId, boardId } = req.params;
  const { data, name } = req.body;

  try {
    // Find room
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    console.log("Updating boardId:", boardId);

    // Find board within room
    const board = room.boards.id(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Update fields if provided
    if (name !== undefined) board.name = name;
    if (data !== undefined) board.data = data;

    board.lastUpdated = new Date();

    // Save room
    await room.save();

    res.json(board);
  } catch (err) {
    console.error("Error updating board:", err);
    if (err.name === 'MongoError' || err.name === 'MongooseError') {
      res.status(500).json({ message: 'Database error', error: err.message });
    } else {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
});


// Delete a board by ID inside a room
router.delete('/:roomId/boards/:boardId', isAuthenticated, async (req, res) => {
  const { roomId, boardId } = req.params;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Find index of board
    const boardIndex = room.boards.findIndex((b) => b._id.toString() === boardId);
    if (boardIndex === -1) return res.status(404).json({ message: 'Board not found' });

    // Remove board
    room.boards.splice(boardIndex, 1);
    await room.save();

    res.json({ message: 'Board deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Add to your rooms route file for debugging
router.get('/:roomId/debug-boards', isAuthenticated, async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const boardsInfo = room.boards.map(b => ({
    name: b.name,
    dataPreview: b.data ? b.data.substring(0, 50) : null,
    dataType: b.data
      ? b.data.startsWith('iVBOR') ? 'PNG Base64'
        : b.data.startsWith('/9j/') ? 'JPG Base64'
        : b.data.startsWith('{') ? 'JSON'
        : 'Unknown'
      : 'Empty'
  }));

  res.json(boardsInfo);
});


module.exports = router;


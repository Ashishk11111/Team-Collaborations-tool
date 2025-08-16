
const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  data: { type: String, default: '' }, // base64 image data or JSON string for drawings
  lastUpdated: { type: Date, default: Date.now },
});

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminId: { type: String, required: true },
  members: [{ type: String, required: true }],
  boards: [BoardSchema], // array of boards inside the room
});

module.exports = mongoose.model('Room', RoomSchema);

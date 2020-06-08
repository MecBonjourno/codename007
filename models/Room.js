const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    user1: {
        type: String,
        required: true
    },
    user2: {
        type: String,
        required: true
    }
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
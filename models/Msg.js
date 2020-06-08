const mongoose = require('mongoose');

const MsgSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Msg = mongoose.model('Msg', MsgSchema);

module.exports = Msg;
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    key: {
        type: String
    },
    activated: {
        type: Boolean,
        default: 0
    },
    completedInfo: {
        type: Boolean,
        default: 0
    },
    completedPics: {
        type: Boolean,
        default: 0
    },
    dob: {
        type: Date
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        default: "male"
    },
    orientation: {
        type: String,
        enum: ["heterosexual", "bisexual", "homosexual"],
        default: "bisexual"
    },
    bio: {
        type: String,
        default: ""
    },
    tags: {
        type: Array,
        default: []
    },
    amount: {
        type: Number,
        default: 0
    },
    p1: {
        type: String,
        default: ''
    },
    p2: {
        type: String,
        default: ''
    },
    p3: {
        type: String,
        default: ''
    },
    p4: {
        type: String,
        default: ''
    },
    p5: {
        type: String,
        default: ''
    },
    agemin: {
        type: Number,
        default: 18
    },
    agemax: {
        type: Number,
        default: 65
    },
    famemin: {
        type: Number,
        default: 0
    },
    famemax: {
        type: Number,
        default: 100
    },
    likes: {
        type: Array,
        default: []
    },
    dislikes: {
        type: Array,
        default: []
    },
    rating: {
        type: Number,
        default: 0
    },
    matches: {
        type: Array,
        default: []
    },
    socket: {
        type: String,
        default: ""
    },
    online: {
        type: Boolean,
        default: false
    },
    lastOnline: {
        type: Date,
        default: Date.now()
    },
    notif: {
        type: Array,
        default: []
    },
    maxdistance: {
        type: Number,
        default: 200,
    },
    mindistance: {
        type: Number,
        default: 0,
    },
    showLoc: {
        type: Boolean,
        default: true
    },
    location: {
        type: {
            type: String,
            default: "Point",
        },
        coordinates: {
            type: [Number], //Coordinates lng then lat for $near to work
            default: 0,
        },
    },
});
UserSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', UserSchema);

module.exports = User;

const express = require('express');
const router = express.Router();
const { ensureCompleted, ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Load Models
const User = require('../models/User');
const Room = require('../models/Room');
const Msg = require('../models/Msg');

router.get('/', ensureAuthenticated, ensureCompleted, (req, res) => {
    res.render('notif', {
        user: req.user
    });
});

module.exports = router;
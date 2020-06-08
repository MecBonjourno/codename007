const express = require('express');
const router = express.Router();
const { ensureCompleted, ensureAuthenticated, forwardAuthenticated } = require('../config/auth');


// Load Models
const User = require('../models/User');
const Room = require('../models/Room');
const Msg = require('../models/Msg');

router.get('/chat', ensureAuthenticated, ensureCompleted, (req, res) => {
    if (req.query.me != req.user.username) {
        req.flash(
            'error_msg',
            "You don't have acces to that page!"
        );
        res.redirect('/dashboard');
    } else {
        User.findOne({ username: req.query.user }).then(user => {
            Room.findOne({ $and: [{ $or: [{ user1: req.query.me }, { user2: req.query.me }] }, { $or: [{ user1: req.query.user }, { user2: req.query.user }] }] }).then((room) => {
                    if (room) {
                    Msg.find({ roomId: room.id })
                    .sort({ date: 1 })
                    .then(msgs => {
                        // let arr = [];
                        // msgs.forEach(msg => {
                        //     if (msg.from == req.query.me) {
                        //         arr.push('<li><div class="me">' + msg.content + '</div></li><div style="clear: both" />');
                        //     } else {
                        //         arr.push('<li><div class="you">' + msg.content + '</div></li><div style="clear: both" />');
                        //     }
                        // });
                        res.render('chat', {
                            user: req.user,
                            recip: user,
                            msgs: msgs
                        });
                    }).catch(err => console.log(err));
                } else {
                    res.render('chat', {
                        user: req.user,
                        recip: user
                    });
                }
            }).catch(err => console.log(err));
        }).catch(err => console.log(err)); 
    }
});

router.get('/', ensureAuthenticated, ensureCompleted, (req, res) => {
    User.find({ username: { $in: req.user.matches }}).then(profiles => {
        res.render('matches', {
            user: req.user,
            profiles: profiles
        }); 
    }).catch(err => console.log(err)); 
})

module.exports = router;
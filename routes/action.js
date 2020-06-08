const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { ensureCompleted, ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

const User = require('../models/User');

function sendEmail(username, reported) {
    
    var text = '<h1>User Report</h1>' + '<p>' + username + ' has reported ' + reported;

    var flag = 1;

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'camagrusocial@gmail.com',
            pass: '!Camagru1793'
        }
    });
    mailOptions = {
        from: '"Matcha" <infosmatcha@gmail.com>',
        to: 'camagrusocial@gmail.com',
        subject: 'User reported',
        text: text,
        html: '<p>' + text + '</p>'
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            flag = 0;
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
    return flag;
}

router.get('/dislike', ensureAuthenticated, ensureCompleted, (req, res) => {
    if (!req.user.likes.includes(req.query.user) && !req.user.dislikes.includes(req.query.user)) {
        User.updateOne({ username: req.user.username }, { $push: { dislikes: req.query.user } }).then(() => {
            res.redirect('/dashboard');
        }).catch(err => console.log(err));
    } else {
        res.redirect('/dashboard');
    }
})

router.get('/like', ensureAuthenticated, ensureCompleted, (req, res) => {
    if (!req.user.likes.includes(req.query.user) && !req.user.dislikes.includes(req.query.user)) {
        User.updateOne({ username: req.query.user }, { $inc: { rating: 1 }}).then(() => {
            User.updateOne({ username: req.user.username }, { $push: { likes: req.query.user }}).then(user => {
                User.findOne({ username: req.query.user }).then(profile => {
                    if (profile) {
                        if(profile.likes.length > 0 && profile.likes.includes(req.user.username)) {
                            User.updateOne({ username: req.user.username }, { $push: { matches: req.query.user}}).then(() => {
                                User.updateOne({ username: req.query.user }, { $push: { matches: req.user.username } }).then(() => {
                                    res.redirect('/dashboard?match=' + req.query.user);
                                }).catch(err => console.log(err));
                            }).catch(err => console.log(err));
                        } else {
                        res.redirect('/dashboard');
                        }
                    } else {
                        res.redirect('/dashboard');
                    }
                }).catch(err => console.log(err));
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
    } else {
        res.redirect('/dashboard');
    }
});

router.get('/unmatch', ensureAuthenticated, ensureCompleted, (req, res) => {
    User.updateOne({ username: req.query.user }, { $pull: { likes: req.query.unmatched, matches: req.query.unmatched }, $push: { dislikes: req.query.unmatched }}).then(() => {
        User.updateOne({ username: req.query.unmatched }, { $pull: { likes: req.query.user, matches: req.query.user }, $push: { dislikes: req.query.user } }).then(() => {
            req.flash(
                'success_msg',
                'Unmatched!'
            );
            res.redirect('../matches');
        }).catch(err => console.log(err));
    }).catch(err => console.log(err));
});

router.get('/report', ensureAuthenticated, ensureCompleted, (req, res) => {
    sendEmail(req.query.user, req.query.reported);
    req.flash(
        'success_msg',
        'The account has been reported and is under review!'
    );
    res.redirect('../dashboard');
})

module.exports = router;
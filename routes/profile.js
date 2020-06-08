const express = require('express');
const router = express.Router();
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const { ensureCompleted, ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const User = require('../models/User');

function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

router.get('/', ensureAuthenticated, ensureCompleted, (req, res) => {
    if (typeof req.query.user != 'undefined') {
        User.findOne({ username: req.user.username }).then(viewer => {
            if (!viewer.dislikes.includes(req.query.user)) {
                User.findOne({ username: req.query.user }).then(user => {
                    res.render('profile', {
                        user: user,
                        page: req.query.page,
                        age: getAge(user.dob),
                        flag: 1,
                        viewer: req.user
                    });
                }).catch(err => console.log(err));
            } else {
                req.flash(
                    'error_msg',
                    "You don't have access to that user's profile!"
                );
                res.redirect('../matches');
            }
        }).catch(err => console.log(err));
    } else {
        if (req.query.page > req.user.amount) {
            res.render('profile', {
                user: req.user,
                page: 1,
                age: getAge(req.user.dob),
                flag: 0
            });
        } else {
            res.render('profile', {
                user: req.user,
                page: req.query.page,
                age: getAge(req.user.dob),
                flag: 0
            });
        }
    }
});

router.get('/edit', ensureAuthenticated, ensureCompleted, (req, res) => {
    res.render('edit', {
        user: req.user
    });
});

router.post('/edit', (req, res) => {
    const { fname, lname, username, gender, orientation, tags, bio, lat, lng, showLoc} = req.body;
    let errors = [];

    if (!fname || !lname || !username || !gender || !orientation || !bio || !tags || !showLoc || !lat || !lng) {
        errors.push({ msg: "Please fill in all fields!" });
    }

    if (errors.length > 0) {
        res.render('edit', {
            user: req.user,
            errors
        });
    } else {
        var tagsArray = tags.split(" ");

        if (username != req.user.username) {
            unameL = req.user.username.length;
            let photos = [];
            glob(req.user.username + "*", { matchBase: true, nodir: true }, (er, files) => {
                files.forEach(item => {
                    let file = item.slice(15);
                    fs.rename(path.join(__dirname, '../public/uploads/' + file), path.join(__dirname, '../public/uploads/' + username + file.slice(unameL)), function (err) {
                        if (err) console.log('ERROR: ' + err);
                    });
                    photos.push(username + file.slice(unameL));
                });
                let j = photos.length;
                for (i = j; i < 5; i++) {
                    photos.push('');
                }
                console.log(photos);
                console.log(req.user.email);
                User.updateOne({ email: req.user.email },
                    { $set: { p1: photos[0], p2: photos[1], p3: photos[2], p4: photos[3], p5: photos[4] } }).then(() => {
                        console.log("data updated");
                    })
                    .catch(err => console.log(err));
            });
        }

        User.find({ username: username }).then(user => {
            if (typeof user[0] != 'undefined' && username != req.user.username) {
                errors.push({ msg: "Username is already in use..." });
                res.render('edit', { user: req.user, errors });
            } else {
                if (errors.length > 0) {
                    res.render('edit', {
                        user: req.user,
                        errors
                    });
                }
                if (showLoc == "No") {
                    loc = false;
                } else {
                    loc = true;
                }
                User.updateOne({ username: req.user.username }, { $set: { fname: fname, lname: lname, username: username, gender: gender, orientation: orientation, tags: tagsArray, bio: bio.trim(), location: { coordinates: [lng, lat] }, showLoc: loc } }).then(() => {
                    req.flash(
                        'success_msg',
                        'Your profile has been updated!'
                    );
                    res.redirect('/dashboard');
                })
                    .catch(err => console.log(err));
            }
        })
            .catch(err => console.log(err));
    }
});

module.exports = router;
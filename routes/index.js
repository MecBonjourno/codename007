const express = require('express');
const router = express.Router();
const arrayMove = require('array-move');
const { ensureCompleted, ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Load User model
const User = require('../models/User');

function calcRating(x) {
    return (1 / (1 + Math.exp(-(0.01 * x))));
}

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

function sortUsersTags(profiles, user) {
    const j = profiles.length;
    let matches = [];
    let amount = 0;
    let first = 0;
    // let ratingHigh = 0.5;
    for (i = 0; i < j; i++) {
        matches = user.tags.filter(element => profiles[i].tags.includes(element));
        amount = matches.length;
        if (amount >= first) {
            first = amount;
            profiles = arrayMove(profiles, i, 0);
        }
    }
    return (profiles);
}

function getLocation() {
    navigator.geolocation.getCurrentPosition(showPosition);
}
function showPosition(position) {
    var coords = { lat: position.coords.latitude, lng: position.coords.longitude };
    console.log(coords);
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    console.log(lng, lat);
}

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, ensureCompleted, (req, res) => {
    let genders = ["Male", "Female"];
    const index = genders.indexOf(req.user.gender);
    let profiles = [];
    if (index > -1) {
        genders.splice(index, 1);
    }
    if (req.user.orientation == "Heterosexual") {
        User.find({ gender: genders[0], completedPics: true, orientation: { $in: ["Heterosexual", "Bisexual"] }, $and: [{ username: { $nin: req.user.likes } }, { username: { $ne: req.user.username } }, { username: { $nin: req.user.dislikes } }] }).then(users => {
            users = sortUsersTags(users, req.user);
            res.render('dashboard', {
                user: req.user,
                profiles: users,
                age: getAge(req.user.dob)
            });
        }).catch(err => console.log(err));
    }
    if (req.user.orientation == "Homosexual") {
        User.find({ gender: req.user.gender, completedPics: true, orientation: { $in: ["Homosexual", "Bisexual"] }, $and: [{ username: { $nin: req.user.likes } }, { username: { $ne: req.user.username } }, { username: { $nin: req.user.dislikes } }] }).then(users => {
            users = sortUsersTags(users, req.user);
            res.render('dashboard', {
                user: req.user,
                profiles: users,
                age: getAge(req.user.dob)
            });
        }).catch(err => console.log(err));
    }
    if (req.user.orientation == "Bisexual") {
        User.find({ gender: req.user.gender, completedPics: true, orientation: { $in: ["Homosexual", "Bisexual"] }, $and: [{ username: { $nin: req.user.likes } }, { username: { $ne: req.user.username } }, { username: { $nin: req.user.dislikes } }]}).then(users => {
            profiles = profiles.concat(users);
            User.find({ gender: genders[0], completedPics: true, orientation: { $in: ["Heterosexual", "Bisexual"] }, $and: [{ username: { $nin: req.user.likes } }, { username: { $ne: req.user.username } }, { username: { $nin: req.user.dislikes } }] }).then(users => {
                profiles = profiles.concat(users);
                users = sortUsersTags(profiles, req.user);
                res.render('dashboard', {
                    user: req.user,
                    profiles: users,
                    age: getAge(req.user.dob)
                });
            })
        }).catch(err => console.log(err));
    }
});

router.post('/age', ensureAuthenticated, (req, res) => {
    const { agemin, agemax } = req.body;
    User.updateOne({ username: req.user.username }, { $set: { agemin: agemin, agemax: agemax }}).then(user => {
        res.redirect('/dashboard');
    }).catch(err => console.log(err));
});

router.post('/rating', ensureAuthenticated, (req, res) => {
    const { famemin, famemax } = req.body;
    User.updateOne({ username: req.user.username }, { $set: { famemin: famemin, famemax: famemax } }).then(user => {
        res.redirect('/dashboard');
    }).catch(err => console.log(err));
});

router.post('/distance', ensureAuthenticated, (req, res) => {
    const { distancemin, distancemax } = req.body;
    User.updateOne({ username: req.user.username }, { $set: { mindistance: distancemin, maxdistance: distancemax } }).then(user => {
        res.redirect('/dashboard');
    }).catch(err => console.log(err));
});

// Profile Completion Page
router.get('/complete_profile', ensureAuthenticated, (req, res) => {
    if (req.user.completedInfo == true) {
        res.redirect('/photos/upload_photos?user=' + req.user.username);
    } else {
        res.render('complete_profile', {
            user: req.user
        });
    }
});

router.post('/complete_profile', (req, res) => {
    const { dob, gender, orientation, tags, bio, lat, lng, showLoc } = req.body;
    let errors = [];
    const usernameLink = req.user.username;
    console.log(lat, lng);

    if (!dob || !gender || !orientation || !bio || !tags || !showLoc) {
        errors.push({ msg: "Please fill in all fields!"});
    }

    var tagsArray = tags.split(" ");

    if (errors.length > 0) {
        res.render('complete_profile', {
            errors,
            dob,
            gender,
            orientation,
            tags,
            bio,
            lat,
            lng,
            showLoc
        });
    }
    
    if (showLoc == "No") {
        loc = false;
    } else {
        loc = true;
    }

    User.updateOne({ username: usernameLink }, { $set: { dob: dob, gender: gender, orientation: orientation, tags: tagsArray, bio: bio.trim(), location: { coordinates: [lng, lat] }, showLoc: loc }}).then(() => {
        User.updateOne({ username: usernameLink }, { $set: { completedInfo: 1 } }).then(() => {
            res.redirect('/photos/upload_photos?user=' + req.user.username);
        });
    })
    .catch(err => console.log(err));   
});

module.exports = router;
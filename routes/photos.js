const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Load User model
const User = require('../models/User');

// Set storage engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        cb(null, req.user.username + '-'  + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 },
    fileFilter: (req, file, cb) => {
        // Allowed extensions
        const filetypes = /jpeg|jpg|png|gif/;
        // Check extension
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        // Check mime
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname){
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
}).fields([{ name: 'p1', maxCount: 1 }, { name: 'p2', maxCount: 1 }, { name: 'p3', maxCount: 1 }, { name: 'p4', maxCount: 1 }, { name: 'p5', maxCount: 1 }]);

router.post('/upload_photos', (req, res) => {
    let errors = [];
    
    upload(req, res, (err) => {
        if (err) {
            errors.push({ msg: err });
            res.render('upload_photos', {
                errors,
                user: req.user
            });
        } else {
            User.findOne({ username: req.user.username }).then(user => {
                if (user) {
                    if (req.files['p1'] == undefined && user.p1 == '') {
                        errors.push({ msg: "Please select at least a profile picture!" });
                        res.render('upload_photos', {
                            errors,
                            user: req.user
                        });
                    } else {
                        let photos = [];
                        for (i = 1; i <= 5; i++) {
                            if (req.files['p' + i] != undefined) {
                                photos.push(req.files['p' + i][0].filename);
                                if (eval("user.p" + i) != "") {
                                    fs.unlink(path.join(__dirname, "../public/uploads/" + eval("user.p" + i)), (err) => {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }
                                    });
                                }
                            }
                            else if (eval("user.p" + i) != "" && req.files['p' + i] == undefined) {
                                photos.push(eval("user.p" + i));
                            }
                        }
                        let j = photos.length;
                        for (i = j; i <= 5; i++) {
                            photos.push('');
                        }
                        if (err) {
                            errors.push({ msg: err });
                            res.render('upload_photos', {
                                errors,
                                user: req.user
                            });
                        } else {
                            User.updateOne({ username: req.user.username }, 
                            { $set: { amount: j, p1: photos[0], p2: photos[1], p3: photos[2], p4: photos[3], p5: photos[4], completedPics: true }}).then(() => {
                                if (req.body.edit == "1") {
                                    req.flash(
                                        'success_msg',
                                        'Your profile has been updated!'
                                    );
                                    res.redirect('/profile?page=1');
                                } else {
                                    req.flash(
                                        'success_msg',
                                        'Your profile has been completed! Enjoy!'
                                    );
                                    res.redirect('/dashboard');
                                }
                            }).catch(err => console.log(err));
                        }
                    }
                }
            })
            .catch(err => console.log(err)); 
        }
    });
});

router.get('/upload_photos', ensureAuthenticated, (req, res) => {
    if (req.query.edit == 1) {
        res.render('upload_photos', {
            user: req.user,
            edit: "edit"
        });
    }
    else if (req.user.completedPics == true) {
        res.redirect('/dashboard');
    } else {
        res.render('upload_photos', {
            user: req.user
        });
    }
});

router.get('/remove', ensureAuthenticated, (req, res) => {
    console.log(req.connection.localAddress)
    if (req.query.photo == 2) {
        User.updateOne({ username: req.user.username }, { $set: { p2: req.user.p3, p3: req.user.p4, p4: req.user.p5, p5: '', amount: req.user.amount - 1 }}).then(() => {
            console.log("p2 removed");
        });
    }
    if (req.query.photo == 3) {
        User.updateOne({ username: req.user.username }, { $set: { p3: req.user.p4, p4: req.user.p5, p5: '', amount: req.user.amount - 1 }}).then(() => {
            console.log("p3 removed");
        });
    }
    if (req.query.photo == 4) {
        User.updateOne({ username: req.user.username }, { $set: { p4: req.user.p5, p5: '', amount: req.user.amount - 1 }}).then(() => {
            console.log("p4 removed");
        });
    }
    if (req.query.photo == 5) {
        User.updateOne({ username: req.user.username }, { $set: { p5: "", amount: req.user.amount - 1 }}).then(() => {
            console.log("p5 removed");
        });
    }
    fs.unlink(path.join(__dirname, "../public/uploads/" + eval("req.user.p" + req.query.photo)), (err) => {
        if (err) {
            console.log(err);
            return;
        } else {
            req.flash(
                'success_msg',
                'Picture has been removed'
            );
            res.redirect('/profile?page=1');
        }
    });
})

module.exports = router;
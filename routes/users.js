const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const uniqid = require('uniqid');

const config = {
    host: "smtp.mailtrap.io",
    port: 25,
    auth:{
        user: "a90f9967334f26",
        pass: "d99ca9b857a5a4"
    }, 
};

function sendEmail(username, key, email, type) {
    if (type == "registration") {
        var text = '<h1>Bem vindo ao 007!</h1>' + '<p>Clique no link abaixo para ativar sua conta: </p>' + '<a href="https://codename007.herokuapp.com/users/activate?username=' + username + '&key=' + key + '">ATIVAR</a>';
    } else {
        var text = '<h1>Redfina sua senha do 007!</h1>' + '<p>Clique no link abaixo para redefinir sua senha: </p>' + '<a href="https://codename007.herokuapp.com/users/reset?username=' + username + '&key=' + key + '">REDEFINIR</a>';
    }
        var flag = 1;

    transporter = nodemailer.createTransport(config
    //     {
    //     service: 'gmail',
    //     auth: {
    //         user: 'camagrusocial@gmail.com',
    //         pass: '!Camagru1793'
    //     }
    // }
    );
    mailOptions = {
        from: '"CodeName 007 - Master Splinter" <Codename007@gmail.com>',
        to: email,
        subject: 'Ative sua conta 007!',
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

// Load User model
const User = require('../models/User');
const { forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', (req, res) => {
    res.render('login', {
        user: req.query.logged_out
    })
});

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
    const { fname, lname, username, email, password, password2 } = req.body;
    let errors = [];

    if (!fname || !lname || !username || !email || !password || !password2) {
        errors.push({ msg: 'Preencha todos os campos!' });
    }

    if (password != password2) {
        errors.push({ msg: 'Senhas não sào identicas' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Senha precisa ter no mínimo 6 caracteres.' });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            fname,
            lname,
            username,
            email,
            password,
            password2
        });
   
    } else {
        User.findOne({ username: username }).then(user => {
            if (user) {
                errors.push({ msg: 'Este nome de usuário já esta cadastrado!' });
                res.render('register', {
                    errors,
                    fname,
                    lname,
                    username,
                    email,
                    password,
                    password2
                }); 
            } else {
                User.findOne({ email: email }).then(user => {
                    if (user) {
                        errors.push({ msg: 'Este email já esta cadastrado!' });
                        res.render('register', {
                            errors,
                            fname,
                            lname,
                            username,
                            email,
                            password,
                            password2
                        });
                    } else {
                        const key = uniqid();
                        const newUser = new User({
                            fname,
                            lname,
                            username,
                            email,
                            password,
                            key
                        });
        
                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(newUser.password, salt, (err, hash) => {
                                if (err) throw err;
                                newUser.password = hash;
                                flag = sendEmail(username, key, email, "registration");
                                if (flag == 1) {
                                    newUser
                                        .save()
                                        .then(user => {
                                            req.flash(
                                                'success_msg',
                                                'Voce agora está registrado! Ative sua conta pelo email que irá receber.'
                                            );
                                            res.redirect('/users/login');
                                        })
                                        .catch(err => console.log(err));
                                } else {
                                    errors.push({ msg: 'Algo deu errado, por favor tente novamente...' });
                                    res.render('register', {
                                        errors,
                                        fname,
                                        lname,
                                        username,
                                        email,
                                        password,
                                        password2
                                    });
                                }
                            });
                        });
                    }
                })
                .catch(err => console.log(err));
            }
        })
        .catch(err => console.log(err));
    }
});

// Check where to send user after loggin in:
// 1) back to login page (not activated via email)
// 2) to profile completion page (activated but profile incomplete)
// 3) to photos page (activated, completed info but need to upload pictures)
// 4) to dashboard (activated and completed info and photos)
router.get('/check', (req, res) => {
    const user = req.user.username;
    User.find({ username: user }).then(user => {
        if (user[0]) {
            if (user[0].activated == 0) {
                req.flash(
                    'error_msg',
                    'Por favor ative sua conta antes de fazer login!'
                );
                res.redirect('/users/login');
            }
            else if (user[0].activated == 1 && user[0].completedInfo == 0) {
                res.redirect('/complete_profile?user=' + user[0].username);
            }
            else if (user[0].activated == 1 && user[0].completedInfo == 1 && user[0].completedPics == 0) {
                res.redirect('../photos/upload_photos?user=' + user[0].username);
            }
            else {
                res.redirect('/dashboard');
            }
        }
    })
    .catch(err => console.log(err));
});

// Login
router.post('/login', passport.authenticate('local', { failureRedirect: '/users/login' , failureFlash: true }), (req, res, next) => {
    res.redirect('/users/check?user=' + req.user.username);
});

// Logout
router.get('/logout', (req, res) => {
    User.updateOne({ username: req.user.username }, { $set: { online: false, lastOnline: Date.now()}}).then(() => {
        let user = req.user.username;
        req.logout();
        req.flash('success_msg', 'Log Out com sucesso!');
        res.redirect('/users/login?logged_out=' + user);
    })
});


// Email activation
router.get('/activate', (req, res) => {
    const key = req.query.key;
    const usernameLink = req.query.username;
    User.find({ username: usernameLink }).then(user => {
        if(user[0]) { 
            if (user[0].activated == 1) {
                req.flash(
                    'error_msg',
                    'Sua conta foi ativada! Prossiga com o Login'
                );
                res.redirect('/users/login');
            }
            else if (user[0].key == key) {
                User.updateOne({ username: usernameLink }, { $set: { activated: 1 }}).then(() => {
                    req.flash(
                        'success_msg',
                        'Sua conta foi ativada! Prossiga com o Login'
                    );
                    res.redirect('/users/login');
                })
                .catch(err => console.log(err));    
            } else {
                req.flash(
                    'error_msg',
                    'Algo deu errado... Por favor use o link recebido no seu email!'
                );
                res.redirect('/users/login');
            } 
        } else {
            req.flash(
                'error_msg',
                'No foi encontrado um usuário com esse nome...'
            );
            res.redirect('/users/login');
        }
    }).catch(err => console.log(err));
});

router.get('/newpwd', (req, res) => {
    res.render('newpwd');
});

router.post('/newpwd', (req, res) => {
    const { email } = req.body;
    User.findOne({ email: email }).then(user => {
        if (user) {
            const key = uniqid();
            User.updateOne({ email: email }, { $set: { key: key }}).then(() => {
                if (sendEmail(user.username, key, email, "newpwd")) {
                    req.flash(
                        'success_msg',
                        'Email enviado!'
                    );
                    res.redirect('login');
                }
            }).catch(err => console.log(err));
        } else {
            req.flash(
                'error_msg',
                'Não foi encontrado usuário com este email...'
            );
            res.render('newpwd');
        }
    }).catch(err => console.log(err));
});

router.get('/reset', (req, res) => {
    if (typeof req.user == 'undefined') {
        let username = req.query.username;
        let key = req.query.key;
        User.findOne({ username: username }).then(user => {
            if (user) {
                if (user.key == key) {
                    res.render('reset', {
                        username: user.username
                    });
                } else {
                    req.flash(
                        'error_msg',
                        'Algo deu errado... Por favor clique no link recebido no seu email para redefinir sua senha!'
                    );
                    res.redirect('newpwd');
                }
            } else {
                req.flash(
                    'error_msg',
                    'Algo deu errado... Por favor clique no link recebido no seu email para redefinir sua senha!'
                );
                res.redirect('newpwd');
            }
        }).catch(err => console.log(err));
    } else {
        res.render('reset', {
            username: req.user.username
        });
    }
});

router.post('/reset', (req, res) => {
    const { pwd, pwd2, username } = req.body;
    let errors = [];

    if (pwd != pwd2) {
        errors.push({ msg: "Senhas não são identicas!" });
    }
    if (!pwd || !pwd2) {
        errors.push({ msg: 'Por favor preencha todos os campos!' });
    }
    if (pwd.length < 6) {
        errors.push({ msg: 'Senhas precisam ter no mínimo 6 caracteres' });
    }

    if (errors.length > 0) {
        res.render('reset', {
            username: username,
            errors
        });
    } else {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(pwd, salt, (err, hash) => {
                if (err) throw err;
                User.updateOne({ username: username }, { $set: { password: hash }}).then(() => {
                    req.flash(
                        'success_msg',
                        'Sua senha foi redefinida!'
                    );
                    if (typeof req.user == 'undefined') {
                        res.redirect('login');
                    } else {
                        res.redirect('../dashboard');
                    }
                }).catch(err => console.log(err));
            });
        });
    }
})

module.exports = router;
module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
                return next();
        }
        req.flash('error_msg', 'Por favor, faça login para continuar!');
        res.redirect('/users/login');
    },
    forwardAuthenticated: function (req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/users/check');
    },
    ensureCompleted: function (req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.completedPics == 1) {
                return next();
            } else {
                req.flash('error_msg', 'Por favor complete sua conta para acessar a página');
                res.redirect('/users/check');
            }
        } else {
            req.flash('error_msg', 'Por favor, faça login para continuar!');
            res.redirect('/users/login');
        }
    }
};
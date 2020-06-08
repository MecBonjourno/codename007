module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
                return next();
        }
        req.flash('error_msg', 'Please log in to access that page');
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
                req.flash('error_msg', 'Please complete your account to access that page');
                res.redirect('/users/check');
            }
        } else {
            req.flash('error_msg', 'Please log in to access that page');
            res.redirect('/users/login');
        }
    }
};
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async(id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false
}, async (email, password, done) => {
    try {
        //Check if email exists
        const user = await User.findOne({'email': email});
        if(!user){
            return done(null, false, {message: 'Unknown User'});
        }
        //Check the Password
        const isValid = User.comparePasswords(password, user.password);
        if(isValid){
            return done(null, user);
        } else {
            return done(null, false, {message: 'Unknown Pasword'});
        }
    } catch (error) {
        return done(error, false);
    }
}));

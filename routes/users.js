const express = require('express');
const router = express.Router();
const Joi = require('joi');
const passport = require('passport');
const User = require('../models/user');

//Validation Schema
const userSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
  confirmationPassword: Joi.any().valid(Joi.ref('password')).required(),
});

//Authorization
const isAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('error','Sorry, but you must be registered first');
    res.redirect('/');
  }
};


//Register Route
router.route('/register')
  .get((req, res) => {
    res.render('register');
  })
  .post(async (req, res, next) => {
    try {
      const result = Joi.validate(req.body, userSchema);
      if (result.error) {
        req.flash('error', 'Data is not valid, please try agian');
        res.redirect('/users/register');
        return;
      }
      const user = await User.findOne({ email: result.value.email });
      if (user) {
        req.flash('error', 'Email is already in use');
        res.redirect('/users/register');
        return;
      }
      //Hashing Password
      const hash = await User.hashPassword(result.value.password);
      console.log('hash', hash);

      //save Users to the database
      delete result.value.confirmationPassword;
      result.value.password = hash;
      const newUser = await new User(result.value);
      console.log(newUser);
      await newUser.save();

      req.flash('success', 'You may now login');
      res.redirect('/users/login');

    }
    catch (error) {
      next(error);
    }
  });

router.route('/login')
  .get((req, res) => {
    res.render('login');
  })
  .post(passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  }));

router.route('/dashboard')
  .get(isAuthenticated, (req, res) => {
    res.render('dashboard', {username: req.user.username});
  });

router.route('/logout')
  .get((req, res) => {
    req.logOut();
    req.flash('success', 'Successfully Logged Out');
    res.redirect('/');
  });
module.exports = router;
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const passport = require('passport');
const randomstring = require('randomstring');
const mailer = require('../misc/mailer');

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
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('error', 'Sorry, but you must be registered first');
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

      //Generate Secret Token
      const secretToken = randomstring.generate();
      result.value.secretToken = secretToken;

      //Flag the account as Inactive
      result.value.active = false;


      //save Users to the database
      delete result.value.confirmationPassword;
      result.value.password = hash;
      const newUser = await new User(result.value);
      console.log(newUser);
      await newUser.save();

      //Compose an Email
      const html = `Hi there
      <br/>
      Thank you for registering!
      <br/>
      Please verify your email by typing the following token:
      <br/>
      Token: ${secretToken}
      <br/>
      On the following page:
      <a href="http://localhost:5000/users/verify">http://localhost:5000/users/verify</a>
      <br/><br/>
      Have a pleasant day!`;

      //send the email
      await mailer.sendEmail('tutormonster2018@hotmail.com', result.value.email, 'Please Verify Your Email', html);

      req.flash('success', 'Please Check Your Email to Verify Your Account');
      res.redirect('/users/verify');


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
    res.render('dashboard', { username: req.user.username });
  });

router.route('/verify')
  .get((req, res) => {
    res.render('verify');
  })
  .post(async (req, res, next)=> {
    try {
      const {secretToken} = req.body;

      //find the account that matches the secret token
      const user = await User.findOne({'secretToken': secretToken.trim()});
      if(!user) {
        req.flash('error', 'no user found');
        res.redirect('/users/verify');
        return;
      }
  
      user.active = true;
      user.secretToken = '';
      await user.save();
  
      req.flash('success', 'Thank you! You may now login');
      res.redirect('/users/login');
    } catch (error) {
      console.log(err);
      next(error);
    }
  });

router.route('/logout')
  .get((req, res) => {
    req.logOut();
    req.flash('success', 'Successfully Logged Out');
    res.redirect('/');
  });
module.exports = router;
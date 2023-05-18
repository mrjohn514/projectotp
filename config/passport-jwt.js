//step 1 import passport
const passport = require('passport')

//requiring strateguy using
const jwtStrategy = require('passport-jwt').Strategy

//module help us to extract jwt from header
const Extractjwt = require('passport-jwt').ExtractJwt

//since we are going to use user model for authenctication
const User = require('../models/user')

let opts = {
  jwtFromRequest: Extractjwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY,
}

passport.use(
  new jwtStrategy(opts, function (jwtpayload, done) {
    User.findById(jwtpayload._id, function (err, user) {
      if (err) {
        console.log('errir ifnding user')
        return
      }

      if (user) {
        return done(null, user)
      } else {
        return done(null, false)
      }
    })
  })
)

module.exports = passport

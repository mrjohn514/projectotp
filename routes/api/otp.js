const express = require('express')
const router = express.Router()
// const rateLimit = require('express-rate-limit')
const otpcontroller = require('../../controllers/api/otp')
const usercontroller = require('../../controllers/api/user')
const passport = require('passport')

router.use(express.urlencoded({ extended: true }))

router.post('/generateotp', otpcontroller.generateotp)

router.post('/create-user', usercontroller.createuser)

module.exports = router

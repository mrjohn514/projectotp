const express = require('express')
const router = express.Router()

const homecontroller = require('./../controllers/homecontroller')

router.get('/', homecontroller.home)

router.use('/api', require('./api/otp'))

module.exports = router

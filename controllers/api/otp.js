const User = require('../../models/user')
const Otp = require('../../models/otp')
const mailer = require('../../config/nodemailer')
const crypto = require('crypto')
const { use } = require('passport')
const CryptoJS = require('crypto-js')
var validator = require('email-validator')

// Encrypt details
const password = process.env.CRYPT_PASSWORD
const iv = process.env.IV

function generateOTP() {
  const otp = crypto.randomInt(100000, 999999)
  return otp.toString()
}

module.exports.generateotp = async (req, res) => {
  try {
    const { email } = req.body

    //if no mail
    if (!email) {
      return res.json({ message: 'No EMAIL' })
    }

    // Check if email format is valid
    if (!validator.validate(email)) {
      return res.status(422).json({
        message: 'Invalid email format',
      })
    }
    // Check if the user exists
    const user = await User.findOne({ email })

    if (
      user &&
      user.lastOtpRequestAt &&
      Date.now() - new Date(user.lastOtpRequestAt).getTime() < 1 * 60 * 1000
    ) {
      const remainingTime = Math.floor(
        (1 * 60 * 1000 -
          (Date.now() - new Date(user.lastOtpRequestAt).getTime())) /
          1000
      )
      return res.status(400).json({
        message: `Please try again in ${remainingTime} seconds.`,
      })
    }

    // if (user && user.isVerified)
    //   return res.json({
    //     message: 'this accoount is already verified try another account',
    //   })

    // Generate and save a new OTP
    const notp = generateOTP()

    //create new otp document
    const newOtp = new Otp({
      otp: notp,
      expiration_time: new Date(Date.now() + 5 * 60 * 1000), // OTP expires in 5 minutes
      verified: false,
    })

    // save the new OTP document and obtain its ID
    const otpDoc = await newOtp.save()
    const otpDocId = otpDoc._id

    // Construct check value for verifying OTP

    const details = {
      id: otpDocId,
      email: email,
    }

    const check = CryptoJS.AES.encrypt(
      JSON.stringify(details),
      process.env.CRYPT_PASSWORD,
      { iv: process.env.IV }
    ).toString()

    if (!user) {
      const newUser = new User({
        email: email,
        lastOtpRequestAt: new Date(),
      })

      await newUser.save()
    }

    if (user) {
      if (!user.isBlocked) user.failedAttempts = 0

      user.lastOtpRequestAt = new Date()
      await user.save()
    }

    // Send the OTP to the user's email address
    await mailer.sendOTP(email, notp)
    return res.json({
      message: 'OTP sent successfully',
      verification_key: check,
    })

    // Check for  minimum 1 min gap between two generate OTP requests.
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

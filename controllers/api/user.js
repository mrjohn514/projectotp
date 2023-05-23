const User = require('../../models/user')
const Otp = require('../../models/otp')
const CryptoJS = require('crypto-js')
const jwt = require('jsonwebtoken')
var validator = require('email-validator')

module.exports.createuser = async (req, res) => {
  console.log(req.body)
  const { email, otp, verification_key } = req.body

  if (!email) {
    return res.json({ message: 'EMAIL is required' })
  }
  if (!otp) {
    return res.json({ message: 'OTP is required' })
  }
  if (!verification_key) {
    return res.json({ message: 'verification key not provided' })
  }

  // Check if email format is valid
  if (!validator.validate(email)) {
    return res.status(422).json({
      message: 'Invalid email format',
    })
  }

  // Check if OTP format is valid
  if (!/^\d{6}$/.test(otp)) {
    return res.status(422).json({
      message: 'OTP should be a 6-digit number',
    })
  }

  let decoded
  try {
    var bytes = CryptoJS.AES.decrypt(
      verification_key,
      process.env.CRYPT_PASSWORD,
      {
        iv: process.env.IV,
      }
    )
    decoded = bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error(error)
    return res.status(400).json({ message: 'Invalid verification key' })
  }

  let obj
  try {
    obj = JSON.parse(decoded)
  } catch (error) {
    // console.error(error)
    return res
      .status(400)
      .json({ message: 'Invalid obj after parsing verification key' })
  }

  // Check if the OTP was meant for the same email or phone number for which it is being verified
  if (obj.email != email) {
    const response = {
      Status: 'Failure',
      Details: 'OTP was not sent to this particular email or phone number',
    }
    return res.status(400).send(response)
  }

  const user = await User.findOne({ email })
  const otp_instance = await Otp.findById(obj.id)

  const now = new Date()
  const blockDuration = 60 * 60 * 1000 // 1 hour in milliseconds
  const failedAttemptThreshold = 5

  if (!user) {
    return res.json({
      message: 'no user found with this email',
    })
  }
  if (!user.email) {
    // If OTP is not defined, return error response with 422 status code
    return res.status(422).json({
      message: 'email not set for this user',
    })
  }

  // if (user.isVerified)
  //   return res.json({
  //     message: 'already verified accoutn',
  //   })

  if (user.isBlocked) {
    if (
      user.failedAttempts >= failedAttemptThreshold &&
      new Date(user.blockedAt.getTime() + blockDuration) > now
    ) {
      const remainingTime =
        new Date(user.blockedAt.getTime() + blockDuration) - now
      const minutes = Math.floor(remainingTime / 1000 / 60)
      const seconds = Math.floor((remainingTime / 1000) % 60)
      const message = `Your account has been blocked. Please try again later in ${minutes} minutes and ${seconds} seconds.`

      return res.status(401).json({
        message: message,
      })
    } else {
      // Unblock the user's account
      user.failedAttempts = 0
      user.isBlocked = false
      user.blockedAt = null
      await user.save()
    }
  }

  //Check if OTP is available in the DB
  if (otp_instance == null) {
    return res.json({
      message: 'Bad Request',
    })
  }
  //Check if OTP is already used or not
  if (otp_instance.verified == true) {
    if (otp !== otp_instance.otp)
      return res.json({ message: 'user is already verified with another otp' })
    else
      return res.json({
        message: 'otp already used please generat new one',
      })
  }
  //Check if OTP is expired or not

  if (new Date(otp_instance.expiration_time) < new Date()) {
    console.log('enterd')
    return res.json({
      message: 'OTP is Expired please generate new one',
    })
  }

  //Check if OTP is equal to the OTP in the DB
  if (otp === otp_instance.otp) {
    // Mark OTP as verified or used
    otp_instance.verified = true
    await otp_instance.save()

    if (!process.env.JWT_SECRET_KEY) {
      return res.json('jwt_key is not set in environment variables')
    }

    const token = await jwt.sign(user.toJSON(), process.env.JWT_SECRET_KEY, {
      expiresIn: '1000000',
    })

    if (!token) {
      return res.json('no token is signed in ')
    }

    if (user) {
      user.isVerified = true
      user.isBlocked = false
      user.failedAttempts = 0
      user.blockedAt = null
      await user.save()
    }
    return res.json(200, {
      message: 'this is your genereated token',
      data: {
        //founded user wil converted to json then this sign fucntion will ecncrypt this user using
        //key codeial
        token: jwt.sign(user.toJSON(), process.env.JWT_SECRET_KEY, {
          expiresIn: '1000000',
        }),
      },
    })
  } else {
    if (user.failedAttempts < 5) {
      //if no user and otp dont match

      user.failedAttempts++
      if (user.failedAttempts >= 5) {
        user.isBlocked = true
        user.blockedAt = Date.now()
      }
      await user.save()

      if (user.isBlocked) {
        const remainingTime =
          new Date(user.blockedAt.getTime() + blockDuration) - now
        const minutes = Math.floor(remainingTime / 1000 / 60)
        const seconds = Math.floor((remainingTime / 1000) % 60)
        const message = `Your account has been blocked. Please try again later in ${minutes} minutes and ${seconds} seconds.`
        return res.status(401).json({
          message: message,
        })
      }
    }

    return res.json({
      message: 'OTP NOT Matched',
    })
  }
}

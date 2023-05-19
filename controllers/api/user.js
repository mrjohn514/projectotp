const User = require('../../models/user')

const jwt = require('jsonwebtoken')

module.exports.createuser = async (req, res) => {
  console.log(req.body)
  const { email, otp } = req.body

  if (!email) {
    return res.json({ message: 'EMAIL is required' })
  }
  if (!otp) {
    return res.json({ message: 'OTP is required' })
  }

  // Check if email format is valid
  if (!/\S+@\S+\.\S+/.test(email)) {
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

  const user = await User.findOne({ email })
  const now = new Date()
  const blockDuration = 60 * 60 * 1000 // 1 hour in milliseconds

  if (!user) {
    return res.json({
      message: 'no user found with this email',
    })
  }
  if (!user.otp) {
    // If OTP is not defined, return error response with 422 status code
    return res.status(422).json({
      message: 'OTP not set for this user',
    })
  }
  if (!user.email) {
    // If OTP is not defined, return error response with 422 status code
    return res.status(422).json({
      message: 'email not set for this user',
    })
  }
  if (user.isused) {
    return res.json({
      message:
        'otp is once used and your email is authenticated login with another accoutn (email)',
    })
  }

  if (user) {
    if (user.isBlocked) {
      const failedAttemptThreshold = 5
      const blockDuration = 60 * 60 * 1000 // 1 hour in milliseconds

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

    if (user.otp.value !== otp && user.failedAttempts < 5) {
      //if no user and otp dont match

      //increment counter
      if (user) {
        user.failedAttempts++
        if (user.failedAttempts >= 5) {
          user.isBlocked = true
          user.blockedAt = Date.now()
        }
        await user.save()
      }

      return res.json(422, {
        message: 'invalid OTP',
      })
    }

    if (
      user.otp.createdAt &&
      Date.now() - new Date(user.otp.createdAt).getTime() > 5 * 60 * 1000
    ) {
      return res.json({
        message:
          'OTP is not valid time range to use otp is 5 min generat new one',
      })
    }

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
      user.isused = true
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
  }
  return res.json({ message: 'INVALID USER' })
}

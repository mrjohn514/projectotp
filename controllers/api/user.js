const User = require('../../models/user')

const jwt = require('jsonwebtoken')

module.exports.createuser = async (req, res) => {
  console.log(req.body)
  const { email, otp } = req.body
  const user = await User.findOne({ email })
  const now = new Date()
  const blockDuration = 60 * 60 * 1000 // 1 hour in milliseconds

  if (!user || (user.otp.value !== otp && user.failedAttempts < 5)) {
    //if no user and otp dont match

    //increment counter
    if (user) {
      user.failedAttempts++
      if (user.failedAttempts >= 5) {
        user.isBlocked = true
      }
      await user.save()
    }

    return res.json(422, {
      message: 'invalid OTP || USER',
    })
  }

  if (user) {
    if (user.isused) {
      return res.json({ message: 'otp already used' })
    }

    if (user.isBlocked) {
      if (new Date(user.lastOtpRequestAt.getTime() + blockDuration) > now) {
        return res.status(401).json({
          message: 'Your account has been blocked. Please try again later.',
        })
      } else {
        // Unblock the user's account
        user.failedAttempts = 0
        user.isBlocked = false
        await user.save()
      }
    }

    // Check if the previous OTP has expired
    // if (
    //   user.otp.createdAt &&
    //   Date.now() - new Date(user.otp.createdAt).getTime() <= 5 * 60 * 1000
    // ) {
    //   return res.status(400).json({
    //     message:
    //       'OTP has already been sent. Please wait for 5 minutes before trying again.',
    //   })
    // }

    if (
      user.otp.createdAt &&
      Date.now() - new Date(user.otp.createdAt).getTime() > 5 * 60 * 1000
    ) {
      return res.json({
        message: 'OTP is not valid time range to use otp is 5 min',
      })
    }

    //crating jwt part is here
    user.isused = true
    await user.save()
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

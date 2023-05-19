const User = require('../../models/user')
const mailer = require('../../config/nodemailer')
const crypto = require('crypto')

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

    // Validate email format
    const validEmailFormat = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/
    if (!validEmailFormat.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    // Check if the user exists
    const user = await User.findOne({ email })
    if (!user) {
      // Generate and save a new OTP
      const otp = generateOTP()

      const newUser = new User({
        email: email,
        otp: {
          value: otp,
          createdAt: new Date(),
        },
        isBlocked: false,
        lastOtpRequestAt: new Date(),
      })

      await newUser.save()

      // Send the OTP to the user's email address
      await mailer.sendOTP(email, otp)

      return res.json({ message: 'OTP sent successfully' })

      // return res.status(400).json({ message: 'User not found' })
    }

    if (
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

    // Check if the previous OTP has expired
    if (
      user.otp.createdAt &&
      Date.now() - new Date(user.otp.createdAt).getTime() <= 5 * 60 * 1000
    ) {
      return res.status(400).json({
        message:
          'OTP has already been sent. Please check your email and try again.',
      })
    }

    // Update the user object with the new OTP and lastOtpRequestAt timestamp
    const otp = generateOTP()
    user.otp.value = otp
    user.otp.createdAt = new Date()
    user.lastOtpRequestAt = new Date()
    await user.save()

    // Send the OTP to the user's email address
    await mailer.sendOTP(email, otp)

    return res.json({ message: 'OTP sent successfully' })

    // Check for  minimum 1 min gap between two generate OTP requests.
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

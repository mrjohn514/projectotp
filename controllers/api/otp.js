const User = require('../../models/user')
const mailer = require('../../config/nodemailer')
const crypto = require('crypto')

function generateOTP() {
  const otp = crypto.randomInt(100000, 999999)
  return otp.toString()
}

module.exports.generateotp = async (req, res) => {
  try {
    console.log('in controler', req.body.email)
    const { email } = req.body

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
      return res.status(400).json({
        message:
          'Please wait for at least 1 minute before generating a new OTP.',
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

// rateLimit({ windowMs: 60000, max: 1 }) is a middleware function commonly used in web development
// with Node.js and Express. It is typically used to limit the rate at which API clients can make
// requests to a server. The options passed to this function specify that the client may only make one
//  request within a rolling window of 60 seconds. If the client makes more than one request within that
//   time frame, the server will respond with an error code indicating that the rate limit has been exceeded.
// This helps prevent abuse of the server and ensure fair usage for all clients. The rateLimit function
// can be installed via the npm package manager by running the command npm install --save express-rate-limit

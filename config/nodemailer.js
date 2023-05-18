const nodemailer = require('nodemailer')
module.exports.sendOTP = async function (email, otp) {
  try {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.MAILUSER,
        pass: process.env.MAILPASS,
      },
    })

    const mailOptions = {
      from: process.env.FUSER,
      to: email,
      subject: 'Your OTP',
      text: `Your OTP is ${otp}.`,
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error(error)
  }
}

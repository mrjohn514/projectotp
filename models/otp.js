// Define the user schema
const mongoose = require('mongoose')
const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    expiration_time: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)
const Otp = mongoose.model('Otp', otpSchema)
module.exports = Otp

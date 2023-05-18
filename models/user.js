// Define the user schema
const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    value: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  lastOtpRequestAt: {
    type: Date,
    default: null,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  failedAttempts: {
    type: Number,
    default: 0,
  },
  isused: {
    type: Boolean,
    default: false,
  },
})
const User = mongoose.model('User', userSchema)
module.exports = User

// Define the user schema
const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
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
  blockedAt: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
})
const User = mongoose.model('User', userSchema)
module.exports = User

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const cookieParser = require('cookie-parser')

const app = express()

app.use(express.json())

app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const connectDB = require('./config/mongoose')

app.use('/', require('./routes'))

connectDB().then(() => {
  app.listen(5000, () => {
    console.log('listening for requests')
  })
})

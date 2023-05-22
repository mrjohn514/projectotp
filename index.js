if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const cookieParser = require('cookie-parser')

const app = express()

app.use(express.json())

app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const db = require('./config/mongoose')

app.use('/', require('./routes'))

app.listen(5000, (err) => {
  if (err) console.log('error')
  else console.log('port is active and running ')
})

const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGOURL)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

module.exports = connectDB

// mongoose.connect(process.env.MONGOURL, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })

// const db = mongoose.connection

// //if there is error handle error
// db.on('error', (error) => {
//   console.log(error)
// })

// //if succes then hurray running
// db.once('open', function () {
//   console.log('the db is connected')
// })

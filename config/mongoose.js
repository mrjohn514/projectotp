const mongoose = require('mongoose')

console.log('inside mongoose', process.env.MONGOURL)

mongoose.connect(process.env.MONGOURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection

//if there is error handle error
db.on('error', (error) => {
  console.log(error)
})

//if succes then hurray running
db.once('open', function () {
  console.log('the db is connected')
})

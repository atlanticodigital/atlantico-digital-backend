const mongoose = require('mongoose')

mongoose.Promise = global.Promise

module.exports = mongoose.connect(process.env.DB_URI, { useNewUrlParser:true, useUnifiedTopology:true, useCreateIndex: true, useFindAndModify: false })
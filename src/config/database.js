const mongoose = require('mongoose')
const env = require('../.env')

mongoose.Promise = global.Promise

module.exports = mongoose.connect(env.dbURI, { useNewUrlParser:true, useUnifiedTopology:true, useCreateIndex: true, useFindAndModify: false })
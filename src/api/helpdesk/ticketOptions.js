const restful = require('node-restful')
const mongoose = restful.mongoose

const options = new mongoose.Schema({
    option: String
})

module.exports = restful.model('Ticket_options', options)
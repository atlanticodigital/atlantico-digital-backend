const restful = require('node-restful')
const mongoose = restful.mongoose

const log = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    action: String,
    registered_at: { type: Date, default: new Date() }
})

module.exports = restful.model('Logging', log)
const restful = require('node-restful')
const mongoose = restful.mongoose

const notifications = new mongoose.Schema({
    client: mongoose.Schema.Types.ObjectId,
    user: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    type: String,
    data: Object,
    created_at: { type: Date, default: Date.now() },
    read_at: Date
})

module.exports = restful.model('notifications', notifications)
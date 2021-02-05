const restful = require('node-restful')
const mongoose = restful.mongoose

const uploads = new mongoose.Schema({
    client: mongoose.Schema.Types.ObjectId,
    user: mongoose.Schema.Types.ObjectId,
    fileName: String,
    path: String,
    uploaded_at: { type: Date, default: new Date }
})

module.exports = restful.model('uploads', uploads)
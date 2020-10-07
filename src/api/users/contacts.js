const restful = require('node-restful')
const mongoose = restful.mongoose

const contacts = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    phone: String,
    document: String,
    zipcode: String,
    birthday: String,
    address_number: String,
    clients: Object,
    agreed: { type: Boolean, default: true },
    profile: Array,
    requested_at: { type: Date, default: Date.now }
})

module.exports = restful.model('Contacts_requests', contacts)
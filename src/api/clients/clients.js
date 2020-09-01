const restful = require('node-restful')
const mongoose = restful.mongoose

const clients = new mongoose.Schema({
    name: { type: String, required: [true, 'Informe o nome do cliente!'] },
    nickname: { type: String, required: false },
    reference: { type: Number, unique: true, required: [true, 'Informe o código do cliente!'], dropDups: true },
    document: { type: String, required: true, required: [true, 'Informe o CNPJ/CPF do cliente!'] },
    status: { type: Boolean, default: true },
    payroll: { type: Boolean, default: true },
    runrunit_id: Number,
    runrunit_projects: [ Number ],
    iugu_id: String,
    created_at: { type: Date, default: Date.now },
})

module.exports = restful.model('Clients', clients)
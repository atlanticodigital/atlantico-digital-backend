const restful = require('node-restful')
const mongoose = restful.mongoose

const forgot = new mongoose.Schema({
    token: String,
    expires_at: { type: Date, default: Date.now() + 86400000 }
})

const users = new mongoose.Schema({
    name: { type: String, required: [true, 'Informe o nome do usuário!'] },
    nickname: { type: String, required: false },
    login: { type: String, unique: true, required: [true, 'Informe o login do usuário!'], dropDups: true },
    password: { type: String, min: 6, max: 12, required: [true, 'Informe a senha do usuário!'] },
    is_admin: { type: Boolean, default: false },
    email: [ Object ],
    phone: [ Object ],
    passwords: {
        dominio: {
            user: String,
            pass: String,
        },
        conta_azul: {
            user: String,
            pass: String,
        },
    },
    agreed: { type: Boolean, default: true },
    status: { type: Boolean, default: true },
    profile: { 
        type: Array,
        required: [true, 'Informe o perfil do usuário!']
    },
    created_at: { type: Date, default: Date.now },
    client: [ Number ],
    forgot_request: forgot,
})

module.exports = restful.model('Users', users)
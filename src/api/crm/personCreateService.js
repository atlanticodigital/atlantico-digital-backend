const bcrypt = require('bcrypt')
const axios = require('axios')
const generator = require('generate-password')

const usersCycle = require('../users/users')
const profileAccess = require('../common/profileAccess')
const sendGrid = require('../common/sendGrid')

const movidesk = async (data) => {

    const connections = (data.connections) ? data.connections.split(",").map(connect => {
            return {
                "id": ("0000" + connect).slice(-4),
                "forceChildrenToHaveSomeAgreement": false,
            }
        }) : {}

    return axios.post(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}`,{
        isActive: true,
        personType: 1,
        profileType: 2,
        businessName: data.name,
        id: data.login,
        emails: data.email.map((email) => { return { emailType: 'Profissional', email: email.value, isDefault: email.primary } }),
        relationships: connections
    })
    .then(response => {
        return true
    })
    .catch(error => {
        console.log(error)
        return false
    })

}

module.exports = async (req, res, next) => {
    const id = req.body.meta.id
    const object = req.body.meta.object
    const action = req.body.meta.action

    if(action === "added" && object === "person") {

        axios.get(`https://api.pipedrive.com/v1/persons/${id}?api_token=${process.env.PIPEDRIVE_TOKEN}`)
            .then(response => {


                const { name, first_name, phone, email } = response.data.data
                const login = response.data.data[process.env.PIPEDRIVE_LOGIN_KEY]
                const connections = response.data.data[process.env.PIPEDRIVE_CONNECTION_KEY]
                const dominioUserPass = response.data.data[process.env.PIPEDRIVE_DOMINIO_ATENDIMENTO_KEY]
                const contaAzulUserPass = response.data.data[process.env.PIPEDRIVE_CONTA_AZUL_KEY]
                const profile = response.data.data[process.env.PIPEDRIVE_PROFILE_KEY] // 95 ADMIN, 96 FINANC, 97 HR, 98 FTAX
                const status = response.data.data[process.env.PIPEDRIVE_STATUS_KEY] // 118 ACTIVE, 119 INACTIVE
                
                usersCycle.findOne({login}, async (err, user) => {
    
                    if(err) {
                        // Enviar notificação Dev
                        return res.status(200).send({errors: ['Find login error.']})
                    } else if (user) {
                        // Enviar notificação CX e Dev
                        return res.status(400).send({errors: ['Login already in use.']})
                    } else {

                        const movideskSignUp = await movidesk({name, email, login, connections})
                    
                        if(!await movideskSignUp){
                            return res.status(422).send({error: ['Não foi possível cadastrar o cliente no movidesk.']})
                        }

                        //Generate random password
                        const password = generator.generate({
                            length: 10,
                            numbers: true,
                            symbols: true,
                            lowercase: true,
                            uppercase: true,
                            excludeSimilarCharacters: true,
                            strict: true,
                        })

                        const salt = bcrypt.genSaltSync()
                        const passwordHash = bcrypt.hashSync(password, salt)

                        //Create user
                        usersCycle.create({
                            name,
                            nickname: first_name,
                            login,
                            password: passwordHash,
                            is_admin: false,
                            email,
                            phone,
                            passwords: {
                                dominio: {
                                    user: (dominioUserPass) ? dominioUserPass.split(":")[0] : null,
                                    pass: (dominioUserPass) ? dominioUserPass.split(":")[1] : null,
                                },
                                conta_azul: {
                                    user: (contaAzulUserPass) ? contaAzulUserPass.split(":")[0] : null,
                                    pass: (contaAzulUserPass) ? contaAzulUserPass.split(":")[1] : null,
                                },
                            },
                            agreed: true,
                            status: (parseInt(status)==118),
                            profile: (profile) ? profile.split(",").map(item => { return profileAccess(item) }) : null,
                            client: (connections) ? connections.split(",").map((item)=>{return parseInt(item)}).filter((id)=>{return id}) : 0,
                        })

                        let msg = [];

                        email.forEach(email => {
                            msg.push({
                                category: 'user.welcome',
                                to: email.value,
                                templateId: process.env.SENDGRID_TEMPLATE_WELCOME,
                                dynamicTemplateData: {
                                    subject: `Bem-vindo a sua conta segura`,
                                    name: first_name,
                                    login,
                                    password,
                                    email: email.value,
                                }
                            })
                        });
                
                        sendGrid.send(msg,true)
                        .then(
                            response => {
                                if(!response){
                                    console.log(`User #${id} welcome notification error, email not sended!`)
                                }else{
                                    console.log(`User #${id} welcome notification sended!`)
                                }
                            }
                        )  
                        
                        return res.status(200).send({success: ['Person created'], msg})

                    }
            
                })
            })

    }else{
        return res.status(200).send({errors: ['Not a person call.']})
    }

}
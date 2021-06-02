const _ = require('lodash')
const bcrypt = require('bcrypt')
const generator = require('generate-password')

const User = require('./users')
const Clients = require('../clients/clients')
const ContactRequests = require('./contacts')
const sendGrid = require('../common/sendGrid')
const profileAccess = require('../common/profileAccess')
const LoggingModel = require('./logging')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

const clients = async (req, res, next) => {

    await User.findOne({_id: req.params.id}, async (error, user) => {
        if(error) {
            return sendErrorsFromDB(res, error)
        } else if (!user.status) {
            return res.status(401).send({errors: ['Blocked user']})
        } else if (user) {
            if(user.client.length>0){

                let clients = []

                for (const [index, reference] of user.client.entries()){

                    await Clients.findOne({reference}, (error, client) => {
                        if(error){
                            clients.push("Cliente não encontrado")
                        }else{
                            clients.push(client)
                        }                         
                    })
                    
                }
        
                res.json(clients)

            }else{
                return res.status(422).send({errors: ['User has no linked clients']})
            }
        }
    })

}

const contacts = async (req, res, next) => {

    await Clients.findOne({_id: req.params.id}, async (error, client) => {
        if(error) {
            return sendErrorsFromDB(res, error)
        } else if (client&&!client.status) {
            return res.status(401).send({errors: ['Blocked client']})
        } else if (client) {
            
            await User.find({client: client.reference}, async (error, users) => {
                if(error) {
                    return sendErrorsFromDB(res, error)
                } else if (users) {
                    return res.status(200).send(users)
                }
            }).sort('name')

        }else{
            return res.status(422).send({errors: ['Client not found!']})
        }
    })

}

const newContact = async (req, res, next) => {
    const body = {
        profile: req.body.profile || null,
        document: req.body.document || null,
        name: req.body.name || null,
        email: req.body.email || null,
        phone: req.body.phone || null,
        zipcode: req.body.zipcode || null,
        address_number: req.body.address_number || null,
        clients: req.body.clients || null,
        birthday: req.body.birthday || null
    }

    for (const [key, value] of Object.entries(body)) {
        if(!value){
            return res.status(422).send({errors: [`Value for ${key} not provided.`]})
        }
    }

    await User.findOne({_id: req.params.id}, async (error, user) => {
        if(error) {
            return sendErrorsFromDB(res, error)
        } else if (user) {

            const dynamicData = {
                subject: `Nova solicitação de contato: ${body.name}`,
                name: body.name,
                email: body.email,
                phone: body.phone,
                document: body.document,
                zipcode: body.zipcode,
                address_number: body.address_number,
                clients: body.clients,
                profile: body.profile.map(profile => { return profileAccess(profile,true) }),
                birthday: body.birthday
            }

            let msg = [];

            user.email.forEach(email => {
                msg.push({
                    category: 'user.new',
                    to: email.value,
                    templateId: process.env.SENDGRID_TEMPLATE_CONTACT_NEW,
                    dynamicTemplateData: dynamicData
                })
            })

            msg.push({
                category: 'user.new',
                to: "agenciablackpearl@gmail.com",
                templateId: process.env.SENDGRID_TEMPLATE_CONTACT_ALERT,
                dynamicTemplateData: dynamicData
            })
    
            sendGrid.send(msg,true)
            .then(
                response => {
                    if(!response){
                        console.log(`New Contact: ${body.name} notification error, email not sended!`)
                    }else{
                        console.log(`New Contact: ${body.name} notification sended!`)
                    }
                }
            )  
            
            ContactRequests.create({
                user: user._id,
                name: body.name,
                email: body.email,
                phone: body.phone,
                document: body.document,
                zipcode: body.zipcode,
                address_number: body.address_number,
                clients: body.clients,
                profile: body.profile,
                birthday: body.birthday
            })

            LoggingModel.create({
                user: user._id,
                action: `Solicitou um novo cadastro de contato: ${body.name}`
            })

            return res.status(200).json({result: ["Contact request done!"]})

        }else{
            return res.status(422).send({errors: ['User not found!']})
        }
    })

}

const welcomeEmailResend = async (req, res, next) => {

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

    await User.findOneAndUpdate({_id: req.params.id},{
        password: passwordHash
        }, 
        async (error, user) => {
            if(error) {
                return sendErrorsFromDB(res, error)
            } else if (user) {

                let msg = [];

                user.email.forEach(email => {
                    msg.push({
                        category: 'user.welcome',
                        to: email.value,
                        templateId: process.env.SENDGRID_TEMPLATE_WELCOME,
                        dynamicTemplateData: {
                            subject: `Bem-vindo a sua conta segura`,
                            name: user.nickname,
                            login: user.login,
                            password,
                            email: email.value,
                        }
                    })
                });
        
                sendGrid.send(msg,true)
                .then(
                    response => {
                        if(!response){
                            console.log(`User #${user.login} welcome notification error, email not sended!`)
                        }else{
                            console.log(`User #${user.login} welcome notification sended!`)
                        }
                    }
                )  

                return res.status(200).json({result: ["Welcome e-mail re-sent!"]})

            }else{
                return res.status(422).send({errors: ['User not found!']})
            }
    })

}

module.exports = { clients, contacts, newContact, welcomeEmailResend }
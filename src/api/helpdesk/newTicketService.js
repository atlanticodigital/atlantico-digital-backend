const axios = require('axios')

const Client = require('../clients/clients')
const User = require('../users/users')
const LoggingModel = require('../users/logging')
const Notifications = require('../notifications/notifications')
const sendGrid = require('../common/sendGrid')

module.exports = async (req, res, next) => {
    const id = req.params.id
    const subject = req.body.subject || null
    const title = req.body.title || null
    const description = req.body.description || null
    const expec_date = req.body.expec_date || null
    const reference = req.body.reference || null

    User.findOne({_id: id}, async (err, user) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (user) {

            const client = await Client.findOne({reference}).exec()

            await axios.get(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}&returnAllProperties=false&id=${user.login}`)
            .then(async (response) => {

                await axios.post(`https://api.movidesk.com/public/v1/tickets?token=${process.env.MOVIDESK_TOKEN}&returnAllProperties=false`,{
                    type: 2,
                    subject: `${subject} - ${title}`,
                    origin: 9,
                    createdBy: { 
                        id: user.login,
                        personType: 1,
                        profileType: 2
                    },
                    tags: [ subject ],
                    clients: [
                        {
                            id: reference,
                            personType: 2,
                            profileType: 2
                        }
                    ],
                    actions: [
                        {
                            type: 2,
                            origin: 9,
                            createdBy: { 
                                id: user.login,
                                personType: 1,
                                profileType: 2
                            },
                            description: `${description} - Data de expectativa: ${expec_date}`
                        }
                    ]
                })
                .then(response => {

                    if(response.data.id){
                        Client.findOne({reference})

                        LoggingModel.create({
                            user: user._id,
                            action: `Criou um ticket de atendimento: #${response.data.id}`
                        })

                        let msg = []

                        console.log(Notifications.create({
                            client: client ? client._id : null,
                            user: user._id,
                            title: "Novo ticket de atendimento criado",
                            description: `Ticket de atendimento #${response.data.id}.`,
                            type: 'ticket',
                            data: {id: response.data.id, subject, title, description, expec_date}
                        }))

                        user.email.map(email => { 

                            msg.push({
                                category: 'ticket.novo',
                                to: email.value,
                                templateId: process.env.SENDGRID_TEMPLATE_NEWTICKET,
                                dynamicTemplateData: {
                                    id: response.data.id,
                                    email: email.value,
                                    type: subject,
                                    title,
                                    date: expec_date,
                                    description
                                }
                            })

                        })

                        sendGrid.send(msg,true)
                        .then(
                            response => {
                                if(!response){
                                    console.log(`New ticket #${response.data.id} notification error, email not sended!`)
                                }else{
                                    console.log(`New ticket #${response.data.id} notification sended!`)
                                }
                            }
                        )  

                        return res.status(200).json({ id: response.data.id, message: 'Ticket created!' });
                    }else{
                        return res.status(400).send({errors: ['Could not create a new ticket!']})
                    }
                })
                .catch(error => {
                    console.log(error)
                    return res.status(400).send({errors: ['Error on create a new ticket!']})
                })

            })
            .catch(error => {
                console.log(error)
                return res.status(400).send({errors: ['It was not possible to create a ticket from this user!']})
            })

        } else {

            return res.status(401).send({errors: ['User not found!']})

        }
    })

}
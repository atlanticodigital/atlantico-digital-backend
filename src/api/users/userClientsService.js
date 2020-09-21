const _ = require('lodash')
const User = require('./users')
const Clients = require('../clients/clients')

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

module.exports = { clients, contacts }
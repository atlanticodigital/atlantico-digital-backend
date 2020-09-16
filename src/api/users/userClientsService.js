const _ = require('lodash')
const User = require('./users')
const Clients = require('../clients/clients')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

module.exports = async (req, res, next) => {

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
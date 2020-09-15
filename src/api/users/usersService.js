const _ = require('lodash')

const usersCycle = require('./users')
const clientsCycle = require('../clients/clients')

const errorHandler = require('../common/errorHandler')
const loginPassHandler = require('../common/loginPassHandler')
const userUpdateService = require('./userUpdateService')

usersCycle.methods(['get', 'post', 'put', 'delete'])
usersCycle.updateOptions({ new: true, runValidators: true })
usersCycle.after('post', errorHandler).after('put', errorHandler).after('put', userUpdateService)
usersCycle.before('post', loginPassHandler).before('put', loginPassHandler)

usersCycle.route('clients', {
    detail: true,
    handler: (req, res, next) => {
        usersCycle.findOne({_id: req.params.id}, async (error, user) => {
            if(error) {
                return sendErrorsFromDB(res, error)
            } else if (!user.status) {
                return res.status(401).send({errors: ['Blocked user']})
            } else if (user) {
                if(user.client.length>0){

                    let clients = []

                    for (const [index, reference] of user.client.entries()){

                        await clientsCycle.findOne({reference}, (error, client) => {
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
})

module.exports = usersCycle
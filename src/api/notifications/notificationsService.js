const _ = require('lodash')
const User = require('../users/users')
const Client = require('../clients/clients')
const Notifications = require('./notifications')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

const list = (req, res, next) => {
    const user_id = req.params.id
    const client_id = req.query.client_id || null
    const start = parseInt(req.query.start) || 0
    const limit = parseInt(req.query.limit) || 12
    const unread = req.query.unread ? true : false

    if(!client_id){
        return res.status(422).send({errors: ['Client Id required!']})
    }

    User.findOne({_id: user_id}, (err, user) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (user) {

            Client.findOne({_id: client_id}, (err, client) => {
                if(err) {
                    return sendErrorsFromDB(res, err)
                } else if (client) {

                    let query = {user: user_id, client: client_id}

                    if(unread){
                        query.read_at = null
                    }
        
                    Notifications.find(query, (err, notifications) => {
                        if(err) {
                            return sendErrorsFromDB(res, err)
                        } else if (notifications) {
                            return res.status(200).json(notifications)
                        }else{
                            return res.status(200).send([])
                        }
                    }).sort({ $natural: -1 }).skip(start).limit(limit)
        
                } else {
        
                    return res.status(401).send({errors: ['Client not found!']})
        
                }
        
            })

        } else {

            return res.status(401).send({errors: ['User not found!']})

        }

    })

}

const read = (req, res, next) => {
    const user_id = req.params.id
    const notification_id = req.query.id || null

    if(!notification_id){
        return res.status(422).send({errors: ['Notification Id required!']})
    }

    User.findOne({_id: user_id}, (err, user) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (user) {
        
            Notifications.findOneAndUpdate({_id: notification_id}, {read_at: Date.now()}, (err, notification) => {
                if(err) {
                    return sendErrorsFromDB(res, err)
                } else if (notification) {
                    return res.status(200).json("Notification updated!")
                }else{
                    return res.status(401).send({errors: ['Notification not found!']})
                }
            })

        } else {

            return res.status(401).send({errors: ['User not found!']})

        }

    })

}

module.exports = { list, read }
const _ = require('lodash')
const Csat = require("./csat")
const User = require('../users/users')
const Client = require('../clients/clients')
const Tasks = require('../tasks/tasks')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

const answer = async (req, res, next) => {
    const answer = req.body.answer || null
    const user = req.body.user || null
    const client = req.body.client || null
    const task = req.body.task_id || null

    if(!answer){
        return res.status(422).send({errors: ['Csat answer is required!']})
    }

    if(!user){
        return res.status(422).send({errors: ['User ID is required!']})
    }

    if(!client){
        return res.status(422).send({errors: ['Client ID is required!']})
    }

    if(!task){
        return res.status(422).send({errors: ['Task ID is required!']})
    }

    User.findOne({_id:user},async (err, userRecord) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (userRecord) {

            Client.findOne({_id:client},async (err, clientRecord) => {
                if(err) {
                    return sendErrorsFromDB(res, err)
                } else if (clientRecord) {
        
                    Tasks.findOne({task_id:task},async (err, taskRecord) => {
                        if(err) {
                            return sendErrorsFromDB(res, err)
                        } else if (taskRecord) {
                
                            Csat.findOne({task,client,user}, async (err, record) => {
                                if(err) {
                                    return sendErrorsFromDB(res, err)
                                } else if (record) {
                                    return res.status(202).json(record)
                                } else {
                        
                                    const newRecord = await Csat.create({
                                        client: {
                                            _id: client,
                                            reference: clientRecord.reference
                                        },
                                        user: {
                                            _id: user,
                                            name: userRecord.name
                                        },
                                        task,
                                        answer
                                    })
                        
                                    return res.status(200).json(newRecord)
                                }
                        
                            })
                
                        } else {
                
                            return res.status(401).send({errors: ['Task not found!']})
                
                        }
                    })
        
                } else {
        
                    return res.status(401).send({errors: ['Client not found!']})
        
                }
            })

        } else {

            return res.status(401).send({errors: ['User not found!']})

        }
    })

}

const comments = async (req, res, next) => {
    const id = req.params.id
    const comments = req.body.comments || null

    if(!comments){
        return res.status(422).send({errors: ['Comments is required!']})
    }

    Csat.findOneAndUpdate({_id:id}, {comments}, async (err, record) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (record) {

            record.comments = comments

            return res.status(200).json(record)
        }
    })
}

module.exports = { answer, comments }
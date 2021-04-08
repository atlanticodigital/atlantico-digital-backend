const _ = require('lodash')
const Csat = require("./csat")
const User = require('../users/users')
const Client = require('../clients/clients')
const Tasks = require('../tasks/tasks')
const { now } = require('lodash')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

const answer = async (req, res, next) => {
    const answer = req.body.answer || null
    const user = req.body.user || null
    const client = req.body.client || null
    const id = req.body.id || null
    const type = req.body.type || null

    if(!answer){
        return res.status(422).send({errors: ['Csat answer is required!']})
    }

    if(!type){
        return res.status(422).send({errors: ['Type is required! task or ticket']})
    }

    if(!user&&type=='task'){
        return res.status(422).send({errors: ['User ID is required!']})
    }

    if(!client&&type=='task'){
        return res.status(422).send({errors: ['Client ID is required!']})
    }

    if(!id){
        return res.status(422).send({errors: ['ID is required!']})
    }

    if(type=='task'){
        User.findOne({_id:user},async (err, userRecord) => {
            if(err) {
                return sendErrorsFromDB(res, err)
            } else if (userRecord) {
    
                Client.findOne({_id:client},async (err, clientRecord) => {
                    if(err) {
                        return sendErrorsFromDB(res, err)
                    } else if (clientRecord) {
            
                        Tasks.findOne({task_id:id},async (err, taskRecord) => {
                            if(err) {
                                return sendErrorsFromDB(res, err)
                            } else if (taskRecord) {
                    
                                Csat.findOne({id,"client._id":client,"user._id":user,type}, async (err, record) => {
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
                                            id,
                                            type,
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
    }else if(type=='ticket'){

        Csat.findOne({id,type}, async (err, record) => {
            if(err) {
                return sendErrorsFromDB(res, err)
            } else if (record) {
                return res.status(202).json(record)
            } else {
    
                const newRecord = await Csat.create({
                    id,
                    type,
                    answer
                })
    
                return res.status(200).json(newRecord)
            }
    
        })

    }

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

const report = async (req, res, next) => {

    var very_dissatisfied = 0
    var dissatisfied = 0
    var neutral = 0
    var satisfied = 0
    var very_satisfied = 0
    var comments = []
    var queryDate = {}

    const filter = req.query.filter || null
    const startAt = req.query.startAt || null
    const endAt = req.query.endAt || null
    const type = req.query.type || null

    if(!filter){
        return res.status(422).send({errors: ['Filter is required!']})
    }

    if(!type){
        return res.status(422).send({errors: ['Type is required!']})
    }

    if(filter=='custom'){

        if(!startAt&&!endAt){
            return res.status(422).send({errors: ['At least one date is required!']})
        }

        if(startAt==endAt||startAt&&!endAt){

            const start = new Date(startAt)
            const end = new Date(startAt)
            end.setHours(44,59,59,999)
    
            queryDate = {
                $gte: start,
                $lte: end
            }
            
        }else if(!startAt&&endAt){

            const start = new Date(endAt)
            const end = new Date(endAt)
            end.setHours(44,59,59,999)
    
            queryDate = {
                $gte: start,
                $lte: end
            }

        }else if(startAt&&endAt){
            const date = new Date(`${endAt}`)
            date.setHours(44,59,59,999)

            queryDate = {
                $gte: new Date(startAt),
                $lte: date
            }
        }

    }

    if(filter=='day'){

        const start = new Date()
        start.setHours(0,0,0,0)

        const end = new Date()
        end.setHours(23,59,59,999)

        queryDate = {
            $gte: start,
            $lte: end
        }

    }

    if(filter=='week'){
        const date = new Date()
        date.setDate(date.getDate() - 6)

        const end = new Date()
        end.setHours(23,59,59,999)

        queryDate = {
            $gte: date,
            $lte: end
        }
    }

    if(filter=='month'){
        const date = new Date()
        const lastDay = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate()

        queryDate = {
            $gte: new Date(`${date.getFullYear()}-${date.getMonth()+1}-01`),
            $lte: new Date(`${date.getFullYear()}-${date.getMonth()+1}-${lastDay}`)
        }
    }

    Csat.find({ //query today up to tonight
        answered_at: queryDate,
        type
    }, async (err, record) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (record) {

            record.forEach(element => {
                
                switch (element.answer) {
                    case "very_dissatisfied":
                        very_dissatisfied ++
                        break;
                    case "dissatisfied":
                        dissatisfied ++
                        break;
                    case "neutral":
                        neutral ++
                        break;
                    case "satisfied":
                        satisfied ++
                        break;
                    case "very_satisfied":
                        very_satisfied ++
                        break;
                }

                if(element.comments){
                    comments.push({
                        reference: element.client.reference,
                        user: element.user.name,
                        data: element.answered_at,
                        comment: element.comments,
                        id: element.id,
                        answer: element.answer,
                    })
                }

            });
           
            return res.status(200).json({
                type,very_dissatisfied,dissatisfied,neutral,satisfied,very_satisfied,comments
            })
        }
    })

}

module.exports = { answer, comments, report }
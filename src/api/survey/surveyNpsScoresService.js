const _ = require('lodash')
const User = require('../users/users')
const Client = require('../clients/clients')
const Nps = require('./nps');
const Avaliation = require('./surveyNpsScores');

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

const answer = async (req, res, next) => {
    const answers = req.body.answers || null
    const user = req.body.user || null
    const client = req.body.client || null
    const survey = req.body.survey || null

    if(!answers){
        return res.status(422).send({errors: ['Nps answers is required!']})
    }

    if(!user){
        return res.status(422).send({errors: ['User ID is required!']})
    }

    if(!client){
        return res.status(422).send({errors: ['Client ID is required!']})
    }

    if(!survey){
        return res.status(422).send({errors: ['Survey ID is required!']})
    }

    User.findOne({_id:user},async (err, userRecord) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (userRecord) {
            Client.findOne({_id:client},async (err, clientRecord) => {
                
                if(err) {
                    return sendErrorsFromDB(res, err)
                } else if (clientRecord) {
                    
                    Nps.findOne({_id: survey}, async (err, npsRecord) => {
                        if(err) {
                            return sendErrorsFromDB(res, err)
                        } else if (npsRecord) {
                
                            Avaliation.findOne({"survey":survey,"client._id":client,"user._id":user}, async (err, record) => {
                                if(err) {
                                    return sendErrorsFromDB(res, err)
                                } else if (!record) {
                                    const newRecord = await Avaliation.create({
                                        client: {
                                            _id: client,
                                            reference: clientRecord.reference,
                                            name: clientRecord.name
                                        },
                                        user: {
                                            _id: user,
                                            name: userRecord.name
                                        },
                                        survey: {
                                            _id: survey
                                        },
                                        answers,
                                    })
                                    return res.status(200).json(newRecord)
                                }
                            })
                        } else {
                            return res.status(401).send({errors: ['Survey not found!']})
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

const report = async (req, res, next) => {
    var zero = 0
    var one = 0
    var two = 0
    var three = 0
    var four = 0
    var five = 0
    var six = 0
    var seven = 0
    var eight = 0
    var nine = 0
    var ten = 0
    var comments = []
    var total = 0
    var detractors = []
    var passives = []
    var promoters = []
    var score = 0

    var queryDate = {}

    const survey = req.query.survey || null

    const filter = req.query.filter || null
    const startAt = req.query.startAt || null
    const endAt = req.query.endAt || null
    const questionIndex = req.query.index || null

    if(!filter){
        return res.status(422).send({errors: ['Filter is required!']})
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

    Avaliation.find({ //query today up to tonight
        answered_at: queryDate,
        survey
    }, async (err, record) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (record) {
            record.forEach(element => {
                switch (element.answers[questionIndex].value) {
                    case 0:
                        zero ++
                        total ++
                        detractors.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 1:
                        one ++
                        total ++
                        detractors.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 2:
                        two ++
                        total ++
                        detractors.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 3:
                        three ++
                        total ++
                        detractors.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 4:
                        four ++
                        total ++
                        detractors.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 5:
                        five ++
                        total ++
                        detractors.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 6:
                        six ++
                        total ++
                        detractors.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 7:
                        seven ++
                        total ++
                        passives.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 8:
                        eight ++
                        total ++
                        passives.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 9:
                        nine ++
                        total ++
                        promoters.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                    case 10:
                        ten ++
                        total ++
                        promoters.push({user: element.user.name, reference: element.client.reference, client: element.client.name})
                        break;
                }

                if(element.answers[questionIndex].comment){
                    comments.push({
                        reference: element.client.reference,
                        user: element.user.name,
                        data: element.answered_at,
                        comment: element.answers[questionIndex].comment,
                        answer: element.answers[questionIndex].value,
                    })
                }

            });

            score = Math.floor((promoters.length/total)*100) - Math.floor((detractors.length/total)*100)
           
            return res.status(200).json({
                zero, one, two, three, 
                four, five, six, seven, 
                eight, nine, ten, detractors, 
                passives, promoters, total, 
                score, comments
            })
        }
    })

}

const search = (req, res, next) => {
    const key = req.query.key || null

    if(!key){
        return res.status(422).send({errors: ['Search key not provided.']})
    }

    Nps.find({ $or: [{ client: req.params.id, "title": { $regex: key, $options: "i" }}]},
            (err, surveys) => {
                if(err) {
                    return sendErrorsFromDB(res, err)
                }else if(surveys){
                    const results = surveys.map(survey => {
                        return {
                            _id: survey._id,
                            title: survey.title,
                            questions: survey.questions,
                            created_at: survey.created_at,
                            option: survey.option,
                            published_up: survey.published_up,
                            published_down: survey.published_down,
                        }
                    })

                    return res.status(200).json(results)
                }else{
                    return res.status(200).send({errors: ['No records found!']})
                }
    })  
}

const list = (req, res, next) => {
    const user = req.query.user;
    let answeredSurveys = [];
    const activeDate = new Date;

    User.findOne({_id:user}, async (err, userRecord) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (userRecord) {
            Avaliation.find({
                "user._id": user
            }, async (err, surveys) => {
                if(err){
                    return sendErrorsFromDB(res, err)
                } else if (surveys){
                    surveys.map(sv => {
                        answeredSurveys.push(sv.survey);
                    })
                    Nps.find({
                        _id: { "$nin": answeredSurveys },
                        published_up: { $lte: activeDate},
                        published_down: { $gte: activeDate},
                    }, async(err, surveys) => {
                        if(err){
                            return sendErrorsFromDB(res, err)
                        } else if (surveys){
                            return res.status(200).json(surveys);
                        }
                    }).sort({'priority': -1})
                }   
            })
        }
    })
}

module.exports = { answer, report, search, list }
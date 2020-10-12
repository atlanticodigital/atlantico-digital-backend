const _ = require('lodash')
const User = require('./users')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

const prepare = (req, res, next) => {
    const password = req.body.password || null
    const verifyPassword = req.body.verifyPassword || null

    if(!password||!verifyPassword){
        return res.status(400).send({errors: ['You have entered empty password']})
    }

    if(password != verifyPassword){
        return res.status(422).send({errors: ['Passwords do not match.']})
    }

    next()
}

const newProspect = async (req, res, next) => {
    const body = {
        name: req.body.name || null,
        login: req.body.login || null,
        password: req.body.password || null
    }

    for (const [key, value] of Object.entries(body)) {
        if(!value){
            return res.status(422).send({errors: [`Value for ${key} not provided.`]})
        }
    }

    await User.create({
        name: body.name,
        email: body.login,
        login: body.login,
        password: body.password,
        prospect: true
    })

    req.body.password = req.body.verifyPassword
    
    next()
}

module.exports = { prepare, newProspect }
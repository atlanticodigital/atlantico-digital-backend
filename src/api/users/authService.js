const _ = require('lodash')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('./users')
const env = require('../../.env')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

const login = (req, res, next) => {
    const login = req.body.login || ''
    const password = req.body.password || ''

    User.findOne({login}, (err, user) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (user && bcrypt.compareSync(password, user.password)) {

            const token = jwt.sign(user.toJSON(), env.authSecret, {
                expiresIn: "1 day"
            })

            res.json({ user, token, expiresIn: "1 day" })

        } else {

            return res.status(400).send({errors: ['You have entered the wrong username or password']})

        }
    })
}

const validateToken = (req, res, next) => {
    const token = req.body.token || ''

    jwt.verify(token, env.authSecret, function(err, decoded) {

        return res.status(200).send({valid: !err})

    })
}

module.exports = { login, validateToken } 
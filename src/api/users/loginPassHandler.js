const _ = require('lodash')
const bcrypt = require('bcrypt')
const usersCycle = require('./users')

// const emailRegex = /\S+@\S+\.\S+/
const passwordRegex = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@#$%^&():;<>,.?~_+-=]).{6,20})/

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

module.exports = (req, res, next) => {
    const password = req.body.password || null
    const login = req.body.login || null

    if(password){
        if(!password.match(passwordRegex)) {
            return res.status(400).send({errors: [
                "Password must be 6-20 characters and numbers. Must have symbols (@#$%) one uppercase letter and one lowercase letter."
            ]})
        }
    
        const salt = bcrypt.genSaltSync()
        const passwordHash = bcrypt.hashSync(password, salt)
        
        req.body.password = passwordHash
    }

    if(login){
        usersCycle.findOne({login}, (err, user) => {
    
            if(err) {
                return sendErrorsFromDB(res, err)
            } else if (user) {
                return res.status(400).send({errors: ['Login already in use.']})
            } else {
                next()
            }
    
        })
    }else{
        next()
    }

}
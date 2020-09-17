const _ = require('lodash')
const bcrypt = require('bcrypt')
const User = require('./users')

const passwordRegex = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%]).{6,20})/

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

module.exports = (req, res, next) => {
    const password = req.body.password || null
    const newPassword = req.body.newPassword || null
    const verifyPassword = req.body.verifyPassword || null

    if(!password||!newPassword||!verifyPassword){
        return res.status(400).send({errors: ['You have entered empty password']})
    }
    
    User.findOne({_id: req.params.id}, async (err, user) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (user && bcrypt.compareSync(password, user.password)) {

            if(newPassword === verifyPassword){

                if(!newPassword.match(passwordRegex)) {
                    return res.status(406).send({errors: [
                        "Password must be 6-20 characters and numbers. Must have symbols (@#$%) one uppercase letter and one lowercase letter."
                    ]})
                }
            
                const salt = bcrypt.genSaltSync()
                const passwordHash = bcrypt.hashSync(newPassword, salt)
                
                user.password = passwordHash
                user.save()
        
                return res.status(200).json({ message: 'Password changed.' });
                
            }else{
                return res.status(422).send({errors: ['Passwords do not match.']})
            }

        } else {

            return res.status(401).send({errors: ['You have entered the wrong password']})

        }
    })

}
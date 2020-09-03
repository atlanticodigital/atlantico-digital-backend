const _ = require('lodash')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const async = require('async');

const User = require('./users')

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

            const token = jwt.sign(user.toJSON(), process.env.AUTH_SECRET, {
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

    jwt.verify(token, process.env.AUTH_SECRET, function(err, decoded) {

        return res.status(200).send({valid: !err})

    })
}

const forgot = (req, res, next) => {

    async.waterfall([
        function(done) {
            const login = req.body.login || ''

            User.findOne({login}, (err, user) => {
                if (user) {
                    done(err, user);
                } else {
                    done('User not found.');
                }
            })

          },
          function(user, done) {

            // create the random token
            crypto.randomBytes(20, function(err, buffer) {
              var token = buffer.toString('hex');
              done(err, user, token);
            })
            
          },
          function(user, token, done) {

            User.findOneAndUpdate({_id: user._id}, {
                forgot_request: {
                    token
                }
            },
            (err, user) => {

                if(err) {
                    console.log(err)
                } else if (user) {
                    done(err, token, user);
                }
        
            })

          },
          function(token, user, done) {
            return res.json({ token });
          }
    ], function(err) {
        return res.status(422).json({ message: err });
    })
    
}

const passwordRegex = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%]).{6,20})/

const recover = (req, res, next) => {
    const newPassword = req.body.newPassword || ''
    const verifyPassword = req.body.verifyPassword || ''

    User.findOne({'forgot_request.token': req.body.token, 'forgot_request.expires_at': {$gt: Date.now()}},
    (err, user) => {

        if(err) {
            return res.status(400).json({ message: err });
        } else if (user) {

            if(newPassword === verifyPassword){

                if(!newPassword.match(passwordRegex)) {
                    return res.status(400).send({errors: [
                        "Password must be 6-20 characters and numbers. Must have symbols (@#$%) one uppercase letter and one lowercase letter."
                    ]})
                }
            
                const salt = bcrypt.genSaltSync()
                const passwordHash = bcrypt.hashSync(newPassword, salt)
                
                user.password = passwordHash
                user.save()

                return res.status(200).json({ message: 'Password reset successfully.' });
            }else{
                return res.status(422).send({errors: ['Passwords do not match.']})
            }

        } else {
            return res.status(400).send({errors: ['Password reset token is invalid or has expired.']})
        }

    })

}

module.exports = { login, validateToken, forgot, recover } 
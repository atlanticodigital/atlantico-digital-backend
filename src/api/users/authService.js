const _ = require('lodash')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const async = require('async')
const email = require('../common/sendGrid')
const LoggingModel = require('../users/logging')

const User = require('./users')
const Client = require('../clients/clients')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

const login = (req, res, next) => {
    const login = req.body.login || ''
    const password = req.body.password || ''

    if(!login||!password){
        return res.status(400).send({errors: ['You have entered the wrong username or password']})
    }

    User.findOne({login}, async (err, user) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (!user.status) {
            return res.status(401).send({errors: ['Blocked user']})
        } else if (user && bcrypt.compareSync(password, user.password)) {

            const token = jwt.sign(user.toJSON(), process.env.AUTH_SECRET, {
                expiresIn: "1 day"
            })

            LoggingModel.create({
                user: user._id,
                action: "Login"
            })

            let primary = null

            if(user.client[0]){
                await Client.findOne({reference: user.client[0]}, (err, client) => {
                    if(client){
                        primary = client
                    }
                })
            } else {
                return res.status(422).send({errors: ['User has no linked clients']})
            }

            if(!primary){
                return res.status(422).send({errors: ['None clients found for this user']})
            }

            res.json({ user, primary, token, expiresIn: "1 day" })

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
                    done('Token was not created.');
                } else if (user) {
                    LoggingModel.create({
                        user: user._id,
                        action: "Solicitou recuperação de senha"
                    })

                    if(!user.email.length&&!user.email[0].value){
                        done('User has no e-mail to send notifications.')
                    }else{
                        let msg = [];

                        user.email.forEach(email => {
                            msg.push({
                                to: email.value,
                                templateId: process.env.SENDGRID_TEMPLATE_RECOVER,
                                dynamicTemplateData: {
                                    name: user.name,
                                    email: email.value,
                                    link: `https://atlantico.digital/auth/recover/${token}`
                                }
                            })
                        });

                        email.send(msg,true)
                        .then(
                            response => {
                                if(!response){
                                    done('E-mail notification was not sended.')
                                }else{
                                    done(err, token, user)
                                }
                            }
                        )                        

                    }
                }
        
            })

          },
          function(token, user, done) {
            const sendedTo = user.email.map(email => email.value.replace(/(.{3})(.*)(?=@)/,
                function(gp1, gp2, gp3) { 
                    for(let i = 0; i < gp3.length; i++) { 
                        gp2+= "*"; 
                    } return gp2; 
                })
            )

            return res.json({ token, sendedTo });
          }
    ], function(err) {
        return res.status(422).json({ message: err });
    })
    
}

const passwordRegex = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%]).{6,20})/

const recover = (req, res, next) => {
    const newPassword = req.body.newPassword || ''
    const verifyPassword = req.body.verifyPassword || ''

    User.findOne({'forgot_request.token': req.body.token, 'forgot_request.expires_at': {$gt: Date.now()}, 'forgot_request.recovered_at': null},
    (err, user) => {

        if(err) {
            return res.status(401).json({ message: err });
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
                user.forgot_request.recovered_at = Date.now()
                user.save()

                return res.status(200).json({ message: 'Password reset successfully.' });
            }else{
                return res.status(422).send({errors: ['Passwords do not match.']})
            }

        } else {
            return res.status(401).send({errors: ['Password reset token is invalid or has expired.']})
        }

    })

}

module.exports = { login, validateToken, forgot, recover } 
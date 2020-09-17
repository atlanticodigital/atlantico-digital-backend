const axios = require('axios')

const User = require('../users/users')

module.exports = async (req, res, next) => {
    const id = req.params.id
    const subject = req.body.subject || null
    const title = req.body.title || null
    const description = req.body.description || null
    const expec_date = req.body.expec_date || null
    const reference = req.body.reference || null

    User.findOne({_id: id}, async (err, user) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (user) {

            await axios.post(`https://api.movidesk.com/public/v1/tickets?token=${process.env.MOVIDESK_TOKEN}&returnAllProperties=false`,{
                type: 2,
                subject: `${subject} - ${title}`,
                origin: 9,
                createdBy: { 
                    id: user.login,
                    personType: 1,
                    profileType: 2
                },
                tags: [ subject ],
                clients: [
                    {
                        id: reference,
                        personType: 2,
                        profileType: 2
                    }
                ],
                actions: [
                    {
                        type: 2,
                        origin: 9,
                        createdBy: { 
                            id: user.login,
                            personType: 1,
                            profileType: 2
                        },
                        description: `${description} - Data de expectativa: ${expec_date}`
                    }
                ]
            })
            .then(response => {

                if(response.data.id){
                    return res.status(200).json({ id: response.data.id, message: 'Ticket created!' });
                }else{
                    return res.status(400).send({errors: ['Could not create a new ticket!']})
                }
            })
            .catch(error => {
                console.log(error.data)
                return res.status(400).send({errors: ['Error on create a new ticket!']})
            })

        } else {

            return res.status(401).send({errors: ['User not found!']})

        }
    })

}
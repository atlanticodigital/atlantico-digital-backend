const axios = require('axios')
const email = require('../common/sendGrid')

module.exports = async (req, res, next) => {
    const Id = req.body.Id
    const Subject = req.body.Subject

    await axios.get(`https://api.movidesk.com/public/v1/tickets?token=${process.env.MOVIDESK_TOKEN}&id=${Id}`)
    .then(async (response) => {
        const data = response.data
        const client = data.clients[0]

        if(client||client.id||client.email){

            const msg = {
                to: "agenciablackpearl@gmail.com",
                templateId: process.env.SENDGRID_TEMPLATE_TICKET_CSAT,
                dynamicTemplateData: {
                    email: "agenciablackpearl@gmail.com",
                    clientid:0,
                    userid:0,
                    title: Subject,
                    id: Id,
                }
            }

            email.send(msg)
            .then(
                response => {
                    if(!response){
                        return res.status(422).send({error: 'E-mail not sended'})
                    }else{
                        return res.status(200).send(data)
                    }
                }
            )       

        }else{
            return res.status(422).send({error: 'Client not found'})
        }
    })
    .catch(error => {
        console.log(error)
        return res.status(400).send(error)
    })

    // return res.status(200).send({Id, Subject})

}
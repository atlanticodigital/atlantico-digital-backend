const axios = require('axios')
const email = require('../common/sendGrid')

module.exports = async (req, res, next) => {
    const Id = req.body.Id
    const Subject = req.body.Subject

    console.log(`Ticket #${Id} finalizado, enviar pesquisa`)

    await axios.get(`https://api.movidesk.com/public/v1/tickets?token=${process.env.MOVIDESK_TOKEN}&id=${Id}`)
    .then(async (response) => {
        const data = response.data
        var client = data.clients[0]

        if(data.category=="Abertura de Tarefa"||data.category=="Tarefas em Andamento"){
            return res.status(422).send({error: `Ticket #${Id}: Category forbidden.`})
        }

        if(!client.email&&data.clients[1]){
            client = data.clients[1]
        }

        if(!client.email&&data.clients[0]&&data.clients[0].organization.email){
            client.email = data.clients[0].organization.email
        }

        if(client&&client.id&&client.email&&data.subject){

            const msg = {
                category: 'ticket.csat',
                to: client.email,
                templateId: process.env.SENDGRID_TEMPLATE_TICKET_CSAT,
                dynamicTemplateData: {
                    email: client.email,
                    clientid:0,
                    userid:0,
                    title: data.subject,
                    id: Id,
                }
            }

            email.send(msg)
            .then(
                response => {
                    if(!response){
                        return res.status(422).send({error: 'E-mail not sended'})
                    }else{
                        return res.status(200).send(msg)
                    }
                }
            )    

        }else{
            return res.status(411).send({error: 'Client or e-mail not found'})
        }

    })
    .catch(error => {
        console.log(error)
        return res.status(400).send(error)
    })

    // return res.status(200).send({msg})   

}
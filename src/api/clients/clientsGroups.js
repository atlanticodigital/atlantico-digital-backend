const Clients = require('./clients')

const list = async (req, res, next) => {

    await Clients.findOne({_id: req.params.id}, async (error, client) => {
        if(error) {
            return sendErrorsFromDB(res, error)
        } else if (client&&!client.status) {
            return res.status(401).send({errors: ['Blocked client']})
        } else if (client&&!client.group_key) {
            return res.status(422).send({errors: ['Client does not belong to any group!']})
        } else if (client) {
            
            await Clients.find({group_key: client.group_key}, async (error, clients) => {
                if(error) {
                    return sendErrorsFromDB(res, error)
                } else if (clients) {
                    return res.status(200).send(clients)
                }
            }).sort('reference')

        }else{
            return res.status(422).send({errors: ['Client not found!']})
        }
    })

}

module.exports = { list }
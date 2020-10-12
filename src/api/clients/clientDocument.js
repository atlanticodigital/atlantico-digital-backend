const axios = require('axios')

const Clients = require('./clients')

const request = async (req, res, next) => {
    const document = req.params.document

    await axios.get(`https://www.receitaws.com.br/v1/cnpj/${document}`)
        .then(response => {

            let data = response.data

            if(response.data.status==="ERROR"){
                return res.status(400).send({message: response.data.message})
            }

            return res.status(200).json(data);
            
        })
        .catch(error => {
            return res.status(400).send({errors: error})
        })

}

const receitaWs = async (req, res, next) => {

    await Clients.findOne({_id: req.params.id}, async (error, client) => {
        if(error) {
            return sendErrorsFromDB(res, error)
        } else if (client&&!client.status) {
            return res.status(401).send({errors: ['Blocked client']})
        } else if (client) {

            const document = client.document.replace(/[-./ ]/g,'')
            
            await axios.get(`https://www.receitaws.com.br/v1/cnpj/${document}`)
            .then(response => {

                let data = response.data

                if(response.data.status==="ERROR"){
                    return res.status(400).send({message: response.data.message})
                }

                return res.status(200).json(data);
                
            })
            .catch(error => {
                return res.status(400).send({errors: error})
            })

        }else{
            return res.status(422).send({errors: ['Client not found!']})
        }
    })

}

module.exports = { receitaWs, request }
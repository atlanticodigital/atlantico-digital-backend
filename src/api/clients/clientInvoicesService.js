const axios = require('axios')
const Client = require('./clients')

const list = async (req, res, next) => {
    const id = req.params.id

    await Client.findOne({_id: id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {
            
            if(!client.iugu_id){
                return res.status(422).send({errors: ['Client has no Iugu Id']})
            }

            await axios.get(`https://api.iugu.com/v1/invoices`, { params: {
                limit: 12,
                customer_id: client.iugu_id,
                api_token: process.env.IUGU_TOKEN
            }})
            .then(response => {

                const data = response.data

                const items = data.items.map((invoice) => {
                    return {
                        invoice_id: invoice.id,
                        url: invoice.secure_url,
                        due_date: invoice.due_date,
                        total: invoice.total,
                        items: invoice.items.map((item) => { return item.description }),
                        status: invoice.status
                    }
                })

                return res.status(200).json({invoices:items});
                
            })
            .catch(error => {
                console.log(error)
                return res.status(401).send({error})
            })

        } else {

            return res.status(422).send({errors: ['Client not found']})

        }
    })

    

}

const query = (req, res, next) => {
    const id = req.query.id || null

    if(!id){
        return res.status(422).send({errors: ['Invoice id not provided.']})
    }

    axios.get(`https://api.iugu.com/v1/invoices/${id}`, { params: {
        api_token: process.env.IUGU_TOKEN
    }})
    .then(response => {

        let data = response.data

        return res.status(200).json({
            invoice_id: data.id,
            url: data.secure_url,
            due_date: data.due_date,
            total: data.total,
            items: data.items.map((item) => { return item.description }),
            status: data.status,
            bank_slip: data.bank_slip
        });
        
    })
    .catch(error => {
        return res.status(422).send({errors: ['Invoice not found.']})
    })

}

module.exports = { list, query }
const axios = require('axios')

const User = require('../users/users')
const Client = require('../clients/clients')

const list = async (req, res, next) => {
    const id = req.params.id
    const project_id = req.query.project_id || null
    const is_closed = req.query.is_closed || true
    const page = req.query.page || 1
    let limit = req.query.limit || 100
    const sort = is_closed ? 'close_date' : 'created_at'
    const sort_dir = req.query.sort_dir || 'desc'

    if (limit>100){
        limit = 100
    }

    const headers = {
        'Content-Type': 'application/json',
        'App-Key': process.env.RUNRUNIT_TOKEN,
        'User-Token': process.env.RUNRUNIT_USER_TOKEN
    }

    if(!project_id){
        return res.status(422).send({errors: ['Project ID is required!']})
    }

    Client.findOne({_id: id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            if(!client.runrunit_projects.includes(parseInt(project_id))){
                return res.status(422).send({errors: ['Project ID does not belong to the client!']})
            }

            await axios.get('https://runrun.it/api/v1.0/tasks', { 
                params: {
                    is_closed,
                    sort,
                    sort_dir,
                    page,
                    limit,
                    project_id,
                },
                headers
            })
            .then(response => {

                return res.status(200).send({ tasks: response.data.filter(task => task.attachments_count).map((task) => {

                    const closed_date = new Date(task.close_date)
                    const date = closed_date.getDate().toString()
                    const month = (closed_date.getMonth()+1).toString()

                    return {
                        id: task.id,
                        title: task.title,
                        closed_at: task.close_date,
                        closed_at_formatted: `${date.padStart(2, '0')}/${month.padStart(2, '0')}/${closed_date.getFullYear()} ${closed_date.getHours()}:${closed_date.getMinutes()}`,
                        client_name: task.client_name,
                    }

                }) });

            })
            .catch(error => {
                console.log(error)
                return res.status(400).send({errors: ['Could not list tasks for the project id provided!']})
            })

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })

}

const query = (req, res, next) => {
    const id = req.query.id || null

    if(!id){
        return res.status(422).send({errors: ['Task id not provided.']})
    }

    const headers = {
        'Content-Type': 'application/json',
        'App-Key': process.env.RUNRUNIT_TOKEN,
        'User-Token': process.env.RUNRUNIT_USER_TOKEN
    }
    
    axios.get(`https://runrun.it/api/v1.0/tasks/${id}/documents`, { headers })
    .then(response => {

        return res.status(200).send({ documents: response.data });

    })
    .catch(error => {
        console.log(error)
        return res.status(400).send({errors: ['Could not list documents for this tasks!']})
    })

}

module.exports = { list, query }
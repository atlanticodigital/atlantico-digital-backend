const _ = require('lodash')
const axios = require('axios')
const async = require('async')

const User = require('../users/users')
const Client = require('../clients/clients')
const Tasks = require('../tasks/tasks')
const LoggingModel = require('../users/logging')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}

const headers = {
    'Content-Type': 'application/json',
    'App-Key': process.env.RUNRUNIT_TOKEN,
    'User-Token': process.env.RUNRUNIT_USER_TOKEN
}

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
                        attachments_count: task.attachments_count
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

const show = (req, res, next) => {
    const id = req.query.id || null

    if(!id){
        return res.status(422).send({errors: ['Task id not provided.']})
    }
    
    axios.get(`https://runrun.it/api/v1.0/tasks/${id}`, { headers })
    .then(response => {

        return res.status(200).send( response.data );

    })
    .catch(error => {
        console.log(error)
        return res.status(400).send({errors: ['Could not list task info!']})
    })

}

const query = (req, res, next) => {
    const id = req.query.id || null

    if(!id){
        return res.status(422).send({errors: ['Task id not provided.']})
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

const download = (req, res, next) => {
    const id = req.query.id || null

    User.findOne({_id: req.params.id},async (err, user) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (user) {

            await axios.get(`https://runrun.it/api/v1.0/documents/${id}/download`, { headers, maxRedirects: 0 })
            .catch(error => {
                if(error.response.status === 302){
                    LoggingModel.create({
                        user: user._id,
                        action: `Realizou um download do runrun.it: #${id}`
                    })

                    return res.status(200).json({link:error.response.headers.location})
                }else{
                    return res.status(400).send({errors: ['Could not download document!']})
                }
            })

        } else {

            return res.status(401).send({errors: ['User not found!']})

        }
    })

}

const downloadZip = (req, res, next) => {
    const ids = req.query.ids || null

    User.findOne({_id: req.params.id},async (err, user) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (user) {

            await axios.get(`https://runrun.it/api/v1.0/documents/download_zip`, { params: {ids}, headers, maxRedirects: 0 })
            .catch(error => {
                if(error.response.status === 302){
                    LoggingModel.create({
                        user: user._id,
                        action: `Realizou um download zipado do runrun.it: #${ids}`
                    })

                    return res.status(200).json({link:error.response.headers.location})
                }else{
                    return res.status(400).send({errors: ['Could not download zip!']})
                }
            })

        } else {

            return res.status(401).send({errors: ['User not found!']})

        }
    })

}

const notify = (req, res, next) => {

    async.waterfall([
        async (done) => {
            const id = req.body.data.task.id
            const event = req.body.event

            if(event=="task:deliver"){

                await axios.get(`https://runrun.it/api/v1.0/tasks/${id}`, { headers })
                .then((task) => {
                    done(null,task.data)
                })
                .catch(error => {
                    done('Task not found!')
                })

            }else{
                done('Task not delivered!')
            }

          },
          async (task, done) => {

            console.log(task)

            await Client.findOne({runrunit_projects: task.project_id}, (error, client) => {
                if(error) {
                    done('Error to find client!')
                } else if (client&&!client.status) {
                    done('Blocked client!')
                } else if (client) {           
                    console.log(client) 
                    done(task,client,done)
                }else{
                    done('Client not found!')
                }
            })
            
          },
          async (task, client, done) => {

            await axios.get(`https://runrun.it/api/v1.0/tasks/${id}/documents`, { headers })
            .then((docs) => {
                done(task,client,docs,done);
            })
            .catch(error => {
                done('Task has no documents!')
            })

          },
          async (task, client, docs, done) => {
              
            await Tasks.findOneAndUpdate({task_id: id}, {
                documents: docs.data,
                closed_at: Date.now()
            },
            (err, taskDocs) => {
                if(err) {
                    done('Error to find task!')
                } else if (!taskDocs) {
                    // Insert
                    Tasks.create({
                        client: client._id,
                        task_id: id,
                        response: req.body,
                        documents: docs.data,
                        closed_at: Date.now()
                    })
                }
            })

            return res.status(200).send({ task: task.data, client, docs: docs.data });
          }
    ], function(err) {
        console.log(err)
        return res.status(400).json({ message: err });
    })

}

module.exports = { list, show, query, download, downloadZip, notify }
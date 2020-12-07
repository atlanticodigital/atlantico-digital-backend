const _ = require('lodash')
const axios = require('axios')
const async = require('async')

const User = require('../users/users')
const Client = require('../clients/clients')
const Tasks = require('../tasks/tasks')
const TasksTypes = require('../tasks/tasksTypes')
const Notifications = require('../notifications/notifications')
const LoggingModel = require('../users/logging')
const email = require('../common/sendGrid')
const FormatBytes = require('../common/formatBytes')


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
    const paramId = req.params.id || null
    const queryId = req.query.user || null

    const _id = paramId || queryId

    User.findOne({_id},async (err, user) => {
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

                    if(queryId){
                        return res.redirect(error.response.headers.location)
                    }else{
                        return res.status(200).json({link:error.response.headers.location})
                    }
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
    const paramId = req.params.id || null
    const queryId = req.query.user || null

    const _id = paramId || queryId

    User.findOne({_id},async (err, user) => {
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


                    if(queryId){
                        return res.redirect(error.response.headers.location)
                    }else{
                        return res.status(200).json({link:error.response.headers.location})
                    }
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
    const id = req.body.data.task.id

    async.waterfall([
        function (done) {
            const event = req.body.event

            if(event=="task:deliver"){

                axios.get(`https://runrun.it/api/v1.0/tasks/${id}`, { headers })
                .then((task) => {
                    if(!task.data.attachments_count){
                        done(`Tarefa #${id} não possui anexos para notificação!`)
                    }
                    done(null,task.data)
                })
                .catch(error => {
                    done(`Tarefa #${id} não foi encontrada no runrun.it!`)
                })

            }else{
                done('Não é uma tarefa que foi entregue!')
            }

        },
        function (task, done) {

            Client.findOne({runrunit_projects: `${task.project_id}`}, (error, client) => {
                if(error) {
                    done('Erro ao localizar cliente na base do Atlântico Digital!')
                } else if (client&&!client.status) {
                    done(`O cliente #${client.reference} está bloqueado no Atlântico Digital!`)
                } else if (client) {
                    done(null, task, client)
                }else{
                    done(`Nenhum cliente encontrado para o projeto #${task.project_id} no Atlântico Digital!`)
                }
            })
            
        },
        async (task, client, done) => {

            return axios.get(`https://runrun.it/api/v1.0/tasks/${task.id}/documents`, { headers })
            .then((docs) => {
                return {task,client,docs:docs.data}
                done(null, task, client, docs.data, done);
            })
            .catch(error => {
                done(`A tarefa #${task.id} não possui documentos anexados.`)
            })

        },
        function (data, done) {
            
            Tasks.findOneAndUpdate({task_id: data.task.id}, {
                documents: data.docs,
                response: data.task,
                closed_at: Date.now()
            },
            (err, taskDocs) => {
                if(err) {
                    done('Erro ao pesquisar no histórico de tarefas no Atlântico Digital!')
                } else if (!taskDocs) {
                    // Insert
                    Tasks.create({
                        client: data.client._id,
                        task_id: data.task.id,
                        response: data.task,
                        documents: data.docs,
                        closed_at: Date.now()
                    })
                }

                done(null,data.task,data.client,data.docs)
            })

        },
        function (task,client,docs,done) {
            
            TasksTypes.findOne({runrunit_id: task.type_id},
            (err, type) => {
                if(err) {
                    done('Erro ao localizar tipo de tarefa no Atlântico Digital!')
                }else if(type){
                    done(null,task,client,docs,type)
                }else{
                    done('Tipo de tarefa não encontrado no Atlântico Digital!')
                }
            })

        },
        function (task,client,docs,type,done) {

            User.find({client: client.reference, $or: [{ profile: type.profile }, { profile: "ADMIN" }]},
            (err, clients) => {
                if(err) {
                    done('Erro ao localizar contatos para notificação no Atlântico Digital!')
                }else if(clients){
                    done(null,task,client,docs,type,clients)
                }else{
                    done('Não foram encontrados contatos para realizar a notificação da tarefa!')
                }
            })            

        },
        function (task,client,docs,type,users,done) {

            let recipients = []
            let msg = [];
            
            users.map(user => { 
                user.email.map(email => { recipients.push({email: email.value, id: user._id}) } )

                Notifications.create({
                    client: client._id,
                    user: user._id,
                    title: task.title,
                    description: `Arquivos #${task.id} disponíveis para download.`,
                    type: 'tasks',
                    data: {
                            id: task.id,
                            title: task.title,
                            project_id: task.project_id
                        }
                })
            })

            const uniqueRecipients = Array.from(new Set(recipients.map(a => a.email)))
                .map(email => {
                    return recipients.find(a => a.email === email)
                })

            let doc_ids = docs.map(doc=>{ return doc.id }).join()

            uniqueRecipients.forEach(recipient => {
                msg.push({
                    to: recipient.email,
                    templateId: process.env.SENDGRID_TEMPLATE_NEWFILES,
                    dynamicTemplateData: {
                        taskid: task.id,
                        email: recipient.email,
                        reference: client.reference,
                        client: client.name,
                        link_zip: `https://api.atlantico.digital/oauth/tasks/downloadzip?user=${recipient.id}&ids=${doc_ids}`,
                        documents: docs.map(doc=>{
                            return {
                                name: doc.data_file_name,
                                size: FormatBytes(doc.data_file_size),
                                link: `https://api.atlantico.digital/oauth/tasks/download?user=${recipient.id}&id=${doc.id}`                                
                            }
                        })
                    }
                })
            });

            email.send(msg,true)
            .then(
                response => {
                    if(!response){
                        done('Ocorreu um erro inesperado e não foi possível realizar a notificação por e-mail para os contatos.')
                    }else{
                        done(null,task,client,docs,type,users)
                    }
                }
            )       

        },
        function (task,client,docs,type,users,done) {
            return res.status(200).send({task,client,docs,type,users});
        }
    ], function(err) {
        console.log(err)

        let msg = {
            to: ["agenciablackpearl@gmail.com"],
            templateId: process.env.SENDGRID_TEMPLATE_ERRORS,
            dynamicTemplateData: {
                subject: `Cliente da tarefa #${id} não foi notificado`,
                title: "Falha ao notificar tarefa",
                description: `Ao realizar a validação de dados para notificação da tarefa #${id}, ocorreram os erros listados abaixo.`,
                errors: [err],
            }
        }

        // email.send(msg)
        // .then(
        //     response => {
        //         if(!response){
        //             console.log(`Task #${id} notification error email not sended!`)
        //         }else{
        //             console.log(`Task #${id} notification error sended!`)
        //         }
        //     }
        // )    

        return res.status(400).json({ message: err });
    })

}

const search = (req, res, next) => {
    const key = req.query.key || null

    if(!key){
        return res.status(422).send({errors: ['Search key not provided.']})
    }

    Client.findOne({_id: req.params.id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            Tasks.find({ $or: [{ client: req.params.id, "response.title": { $regex: key, $options: "i" }}, {client: req.params.id, "documents.data_file_name": { $regex: key, $options: "i" } }] },
            (err, tasks) => {
                if(err) {
                    return sendErrorsFromDB(res, err)
                }else if(tasks){

                    const results = tasks.map(task => {
                        return {
                            id: task.task_id,
                            title: task.response.title,
                            docsFound: task.documents.filter(doc => {
                        
                                if(doc.data_file_name.toLowerCase().includes(key.toLowerCase())){
                                    return doc
                                }
        
                            })
                        }
                    })

                    return res.status(200).json(results)
                }else{
                    return res.status(200).send({errors: ['No records found!']})
                }
            })  

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })
}

const create = (req, res, next) => {

    Client.findOne({reference: req.body.reference}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            Tasks.findOne({task_id: req.body.response.id}, (err, task) => {
                if(err) {
                    return sendErrorsFromDB(res, err)
                }else if(task){
                    return res.status(401).send({errors: [`Task #${req.body.response.id} already exists!`]})
                }else{
                    
                    Tasks.create({
                        client: client._id,
                        task_id: req.body.response.id,
                        response: req.body.response,
                        documents: req.body.documents,
                        closed_at: req.body.closed_at
                    }), (err, task) => {

                        if(err) {
                            return sendErrorsFromDB(res, err)
                        }

                    }
        
                    return res.status(200).json({msg: ['Success'], record: req.body})

                }
            })

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })

}

module.exports = { list, show, query, download, downloadZip, notify, search, create }
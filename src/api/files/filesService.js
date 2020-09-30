const _ = require('lodash')
const Bucket = require('./bucketService')
const Client = require('../clients/clients')
const LoggingModel = require('../users/logging')
const Files = require('./files')

const sendErrorsFromDB = (res, dbErrors) => {
    const errors = []
    _.forIn(dbErrors.errors, error => errors.push(error.message))
    return res.status(400).json({errors})
}


const list = (req, res, next) => {
    let path = req.query.path || ''

    if(path){
        if(path.substring(path.length-1)!="/"){
            path += "/"
        }
    }

    Client.findOne({_id: req.params.id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            const exists = await Bucket.exists(client._id)

            if(exists){

                const data = await Bucket.list(`${client._id}/${path}`)
    
                if(data){
                    return res.status(200).json(data)
                }else{
                    return res.status(400).send({errors: ['Cannot list folder']})
                }

            }else{
                return res.status(400).send({errors: ['Folder does not exists']})
            }

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })

}

const newFolder = (req, res, next) => {
    let path = req.query.path || ''
    const user_id = req.query.user_id || null
    const folder = req.body.folder || ''

    if(path){
        if(path.substring(path.length-1)!="/"){
            path += "/"
        }
    }

    if(!folder){
        return res.status(422).send({errors: ['Folder name required!']})
    }

    Client.findOne({_id: req.params.id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            const data = await Bucket.createFolder(`${client._id}/${path}${folder}/`)

            if(data){
                if(user_id){
                    LoggingModel.create({
                        user: user_id,
                        action: `Criou uma nova pasta: ${folder}`
                    })
                }

                return res.status(200).json("Folder created!")
            }else{
                return res.status(400).send({errors: ['Cannot create folder']})
            }

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })

}

const deleteObject = (req, res, next) => {
    let path = req.query.path || ''
    const user_id = req.query.user_id || null

    Client.findOne({_id: req.params.id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            const data = await Bucket.deleteObject(`${client._id}/${path}`)

            if(data){
                if(user_id){
                    LoggingModel.create({
                        user: user_id,
                        action: `Apagou um arquivo/pasta: ${path}`
                    })
                }

                return res.status(200).json("Object deleted!")
            }else{
                return res.status(400).send({errors: ['Cannot delete object']})
            }

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })

}

const upload = (req, res, next) => {
    let path = req.query.path || ''
    const user_id = req.query.user_id || null
    const fileName = req.body.file_name || null
    const base64data = req.body.base64data || null

    if(path){
        if(path.substring(path.length-1)!="/"){
            path += "/"
        }
    }

    if(!fileName){
        return res.status(422).send({errors: ['File name required!']})
    }

    if(!base64data){
        return res.status(422).send({errors: ['Base64 data required!']})
    }

    base64Data = new Buffer.from(req.body.base64data, 'base64');

    Client.findOne({_id: req.params.id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            const data = await Bucket.upload(`${client._id}/${path}${fileName}`,base64Data)

            if(data){
                if(user_id){
                    LoggingModel.create({
                        user: user_id,
                        action: `Enviou um arquivo: ${fileName}`
                    })
                }

                Files.create({
                    client: client._id,
                    user: user_id,
                    fileName,
                    path: `${path}${fileName}`
                })

                return res.status(200).json("File uploaded!")
            }else{
                return res.status(400).send({errors: ['Cannot upload file']})
            }

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })

}

const lastUploads = (req, res, next) => {
    const limit = parseInt(req.query.limit) || 12

    Client.findOne({_id: req.params.id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            await Files.find({client: client._id}, (err, uploads) => {
                if(err){
                    return sendErrorsFromDB(res, err)
                } else if (uploads) {
                    return res.status(200).send(uploads.map(item => {
                        const uploaded_at = new Date(item.uploaded_at)
                        const date = uploaded_at.getDate().toString()
                        const month = (uploaded_at.getMonth()+1).toString()

                        return {
                            id: item._id,
                            uploaded_at: item.uploaded_at,
                            uploaded_at_formatted: `${date.padStart(2, '0')}/${month.padStart(2, '0')}/${uploaded_at.getFullYear()} ${uploaded_at.getHours()}:${uploaded_at.getMinutes()}`,
                            fileName: item.fileName,
                            path: item.path
                        }
                    }))
                } else {
                    return res.status(200).send({})
                }
            }).limit(limit).sort([['uploaded_at', -1]])

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })

}

module.exports = { list, newFolder, deleteObject, upload, lastUploads }
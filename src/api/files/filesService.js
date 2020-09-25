const Bucket = require('./bucketService')
const Client = require('../clients/clients')

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
    let folder = req.query.folder || ''

    if(path){
        if(path.substring(path.length-1)!="/"){
            path += "/"
        }
    }

    Client.findOne({_id: req.params.id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            const data = await Bucket.createFolder(`${client._id}/${path}${folder}/`)

            if(data){
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

    Client.findOne({_id: req.params.id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            const data = await Bucket.deleteObject(`${client._id}/${path}`)

            if(data){
                return res.status(200).json("Object deleted!")
            }else{
                return res.status(400).send({errors: ['Cannot delete object']})
            }

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })

}

module.exports = { list, newFolder, deleteObject }
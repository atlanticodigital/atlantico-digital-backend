const axios = require('axios')
const qs = require('qs')

const FormatBytes = require('../common/formatBytes')
const Client = require('../clients/clients')

const getToken = () => {

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    const promise = new Promise(async (resolve, reject) => {

        await axios.post(`https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, qs.stringify({
            grant_type: 'password',
            client_id: process.env.MICROSOFT_CLIENT_ID,
            client_secret: process.env.MICROSOFT_CLIENT_SECRET,
            scope: "https://graph.microsoft.com/.default",
            userName: process.env.MICROSOFT_USERNAME,
            password: process.env.MICROSOFT_PASSWORD,
        }), { headers: headers })
        .then(response => {

            if(!response.data.access_token){
                reject(new Error("Access token not provided!"));
            }

            resolve(response.data.access_token)
            
        })
        .catch(error => {
            // console.log(error)
            reject(new Error(error));
        })
        
    })

    return promise

}

const getDrive = (token,reference,itemId=null) => {

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }

    const http = (itemId) ? `/items/${itemId}/children` : `/root:/General/${reference}:/children`

    const promise = new Promise(async (resolve, reject) => {

        await axios.get(`https://graph.microsoft.com/v1.0/drives/${process.env.MICROSOFT_DRIVE_ID}${http}`, { headers: headers })
        .then(response => {

            if(!response.data.value){
                reject(new Error("Nothing to list!"));
            }

            resolve(response.data.value)
            
        })
        .catch(error => {
            console.log(error)
            // console.log(error.response.data)
            // console.log(error.response.config.headers)
            reject(new Error(error.response.data.error));
        })
        
    })

    return promise

}

const list = async (req, res, next) => {
    const id = req.query.itemId || null

    Client.findOne({_id: req.params.id}, async (err, client) => {
        if(err) {
            return sendErrorsFromDB(res, err)
        } else if (client) {

            getToken()
            .then(token => {

                getDrive(token,`${client.reference}`,id)
                .then(async list => {

                    const items = {
                        files: list.filter(item => {

                            if(item.file){
                                return item
                            }
        
                        }).map(item => {
                            const lastModified = new Date(item.fileSystemInfo.lastModifiedDateTime)
                            const date = lastModified.getDate().toString()
                            const month = (lastModified.getMonth()+1).toString()
        
                            return {
                                download: item["@microsoft.graph.downloadUrl"],
                                id: item.id,
                                name: item.name,
                                lastModified: item.fileSystemInfo.lastModifiedDateTime,
                                lastModifiedFormated: `${date.padStart(2, '0')}/${month.padStart(2, '0')}/${lastModified.getFullYear()} ${lastModified.getHours()}:${lastModified.getMinutes()}`,
                                size: FormatBytes(item.size),
                                parentid: item.parentReference.id
                            }
                        }),
                        folders: list.filter(item => {

                            if(item.folder){
                                return item
                            }
        
                        }).map(item => {
                            const lastModified = new Date(item.fileSystemInfo.lastModifiedDateTime)
                            const date = lastModified.getDate().toString()
                            const month = (lastModified.getMonth()+1).toString()
        
                            return {
                                id: item.id,
                                name: item.name,
                                lastModified: item.fileSystemInfo.lastModifiedDateTime,
                                lastModifiedFormated: `${date.padStart(2, '0')}/${month.padStart(2, '0')}/${lastModified.getFullYear()} ${lastModified.getHours()}:${lastModified.getMinutes()}`,
                                size: FormatBytes(item.size),
                                parentid: item.parentReference.id
                            }
                        })
                    }

                    return res.status(200).send(items)

                })
                .catch(error => {
                    console.log(error)
                    return res.status(400).send({error})
                })

            })
            .catch(error => {
                console.log(error)
                return res.status(400).send({error})
            })

        } else {

            return res.status(401).send({errors: ['Client not found!']})

        }

    })

}

module.exports = { list }
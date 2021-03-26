const axios = require('axios')
const qs = require('qs')
const Bucket = require('../files/bucketService')

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

const driveGetToken = () => {

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
            reject(new Error(error));
        })
        
    })

    return promise

}

const getDriveById = (token) => {

    const headers = {
        'Content-Type': 'application/jsonsss',
        'Authorization': `Bearer ${token}`
    }

    // console.log(token)

    const promise = new Promise(async (resolve, reject) => {

        await axios.get(`https://graph.microsoft.com/v1.0/drives/${process.env.MICROSOFT_DRIVE_ID}/root/children/General/children`, { headers: headers })
        .then(response => {

            if(!response.data.value){
                reject(new Error("Nothing to list!"));
            }

            resolve(response.data.value)
            
        })
        .catch(error => {
            console.log(error)
            console.log(error.response.data)
            console.log(error.response.config.headers)
            reject(new Error(error.response.data.error));
        })
        
    })

    return promise

}

const drive = async (req, res, next) => {

    // const result = await Bucket.startDocumentTextDetection("1234","teste")
    Bucket.getDocumentTextDetection("2fcc7da2d954258de75ea1c287272743fb06860017357ddd23a6780ee31f11e0")
        .then(result => {
            return res.status(200).send({result})
        })
        .catch(error => {
            return res.status(400).send({error})
        })

    driveGetToken()
    .then(token => {
        console.log(token)

        getDriveById(token)
        .then(async list => {

            await Bucket.startDocumentTextDetection("teste")

            // const items = list.map(async item => {
            //     let image = await axios.get(item["@microsoft.graph.downloadUrl"], {responseType: 'arraybuffer'});
            //     let raw = Buffer.from(image.data, 'base64');

            //     const path = `10/${item.name}`

            //     const data = await Bucket.upload(path,raw)

            //     // console.log(data)

            //     // await Bucket.startDocumentTextDetection(item.id,"teste",path)
            // })

            return res.status(200).send({list})

        })
        .catch(error => {
            return res.status(400).send({error})
        })

    })
    .catch(error => {
        return res.status(400).send({error})
    })

}

module.exports = { receitaWs, request, drive }
const pipedrive = require('pipedrive')
const axios = require('axios')
const clientsCycle = require('../clients/clients')
const usersCycle = require('../users/users')
const sendGrid = require('../common/sendGrid')
const profileAccess = require('../common/profileAccess')
const bcrypt = require('bcrypt')
const generator = require('generate-password')
const csv = require('csv-parser')
const fs = require('fs')

pipedrive.Configuration.apiToken = process.env.PIPEDRIVE_TOKEN

const getLegacyData = async (reference) => {
    
    const promise = new Promise(async (resolve, reject) => {

        await axios.get(`https://v2.atlantico.digital/api/v1.0/client/${reference}`)
        .then(response => {

            if(response.data.total){
                resolve(response.data.data[0])
            }else{
                reject(new Error("não encontrado"));
            }
            
        })
        .catch(error => {
            reject(new Error(error));
        })
        
    })

    return promise

}

const getIuguData = async (query) => {
    
    const promise = new Promise(async (resolve, reject) => {

        await axios.get(`https://api.iugu.com/v1/customers?limit=1&query=${query}&api_token=1687f2aa269381afb3b5dd98653ff896`)
        .then(response => {

            if(response.data.items[0]){
                resolve(response.data.items[0].id)
            }else{
                reject("não encontrado");
            }
            
        })
        .catch(error => {
            reject('Oops!').catch(err => {
                throw new Error(err);
              });
        })
        
    })

    return promise

}

const getMovideskData = async (id) => {

    id = ("0000" + id).slice(-4)
    
    const promise = new Promise(async (resolve, reject) => {

        await axios.get(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}&id=${id}`)
        .then(response => {

            if(response.data.id){
                resolve(response.data.id)
            }else{
                reject(false);
            }
            
        })
        .catch(error => {
            // reject(error)
            reject(false);
        })
        
    })

    return promise

}

const company = async (req, res, next) => {
    const controller = pipedrive.OrganizationsController
    var input = {}
        // input['userId'] = 58
        // input['filterId'] = 58
        // input['firstChar'] = first_char
        input['start'] = 0
        input['limit'] = 1000
        // input['sort'] = 'sort'

    controller.getAllOrganizations(input, function(error,response,context) {

        var filtered = response.data
            // filtered = filtered.filter((record)=>{return !record["6b376de2db924d3d880186573f66b1d72ab3f2b1"]})
            // filtered = filtered.filter((record)=>{return record.name.includes("ALIANCA PRO EVANGELIZACAO DAS CRIANCAS")})


        const result = filtered.map((record)=>{
            return {
                company_id: record.company_id,
                status: true,
                name: record.name,
                document: record["6b376de2db924d3d880186573f66b1d72ab3f2b1"],
                reference: parseInt(record["71f03070825686ad375d79fb25fd9329b1efcb09"])
            }
        })

        var exists = 0

        // result.forEach(async element => {

        //     const client = await clientsCycle.findOne({reference:element.reference})

        //     if(!client){
        //         console.log(`inserir: ${element.name}`)

        //             element.document = '00.000.000/0000-00'

        //             clientsCycle.create(element)
        //             .catch(error => {
        //                 console.log(error)
        //             })

        //     }else{
        //         exists ++;
        //         console.log(`já existe: ${element.name}`)

        //         clientsCycle.findOneAndUpdate({reference:element.reference}, element)
        //         .catch(error => {
        //             console.log(error)
        //         })

        //         console.log(exists)
        //     }

        // });

        return res.status(200).send({total: result.length,result})

    })

}

const updateCompany = async (req, res, next) => {

    clientsCycle.find()
    .then(clients => {

        clients.forEach(async element => {
            
            // await getLegacyData(element.reference)
            // .then(result => {

            //     console.log(result.name)
            //     clientsCycle.findOneAndUpdate({reference:element.reference}, {
            //         status: parseInt(result.status) ? true : false,
            //         payroll: parseInt(result.folha) ? true : false,
            //         runrunit_projects: [result.runrunproject],
            //         runrunit_id: result.runrunid,
            //         group_key: result.contract,
            //     },(err, user) => {

            //         if(err) {
            //             console.log(err)
            //         } else if (user) {
            //             console.log("Foi!")
            //         }
            
            //     })

            // })

        });

        return res.status(200).send({total: clients.length,clients})
    })

}

const updateIuguCompany = async (req, res, next) => {

    clientsCycle.find({iugu_id: { $exists: false }})
    .then(clients => {

        const result = clients.map(client => {
            return {
                referencia: client.reference,
                cliente: client.name,
            }
        })

        // clients.forEach(async element => {
            
        //     await getIuguData(element.name)
        //     .then(result => {

        //         console.log(result)

        //         clientsCycle.findOneAndUpdate({reference:element.reference}, {
        //             iugu_id: result
        //         },(err, user) => {

        //             if(err) {
        //                 console.log(err)
        //             } else if (user) {
        //                 console.log("Foi!")
        //             }
            
        //         })

        //     })
        //     .catch(error => {
        //         console.log(error)
        //         console.log(`< ${element.name} >`)
        //     })

        // });

        return res.status(200).send({total: clients.length,result})
    })

}

const updateMovideskCompany = async (req, res, next) => {

    clientsCycle.find()
    .then(clients => {

        const result = clients.map(client => {
            return {
                referencia: client.reference,
                cliente: client.name,
            }
        })

        clients.forEach(async element => {
            
            await getMovideskData(element.reference)
            .then(async result => {

                console.log(result)

            })
            .catch(async error => {
                console.log(error)
                console.log(`< ${element.reference} - ${element.name} >`)


                // await axios.post(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}`,{
                //     isActive: true,
                //     personType: 2,
                //     profileType: 2,
                //     corporateName: element.name,
                //     businessName: element.name,
                //     id: element.reference
                // })
                // .then(response => {
                //     console.log(response.data)
                // })
                // .catch(error => {
                //     console.log(error)
                // })
            })

        });

        return res.status(200).send({total: clients.length,result})
    })

}

const person = async (req, res, next) => {
    const controller = pipedrive.PersonsController
    var input = {}
        // input['userId'] = 58
        // input['filterId'] = 58
        // input['firstChar'] = first_char
        input['start'] = 0
        input['limit'] = 1000
        // input['sort'] = 'sort'

    controller.getAllPersons(input, function(error,response,context) {

        var filtered = response.data
            filtered = filtered.filter((record)=>{return record[process.env.PIPEDRIVE_LOGIN_KEY] })
            filtered = filtered.filter((record)=>{return record[process.env.PIPEDRIVE_PROFILE_KEY] })
            // filtered = filtered.filter((record)=>{return record.email.length > 3})

            const result = filtered.map((record)=>{

                const dominioUserPass = record[process.env.PIPEDRIVE_DOMINIO_ATENDIMENTO_KEY]
                const status = record[process.env.PIPEDRIVE_STATUS_KEY]
                const profile = record[process.env.PIPEDRIVE_PROFILE_KEY] // 95 ADMIN, 96 FINANC, 97 HR, 98 FTAX
                var connections = record[process.env.PIPEDRIVE_CONNECTION_KEY]

                return {
                    id: record.id,
                    name: record.name,
                    nickname: record.first_name,
                    login: record[process.env.PIPEDRIVE_LOGIN_KEY],
                    is_admin: false,
                    email: record.email,
                    phone: record.phone,
                    passwords: {
                        dominio: {
                            user: (dominioUserPass&&dominioUserPass.includes(":")) ? dominioUserPass.split(":")[0] : null,
                            pass: (dominioUserPass&&dominioUserPass.includes(":")) ? dominioUserPass.split(":")[1] : null,
                        }
                    },
                    agreed: true,
                    status: (parseInt(status)==118),
                    profile: (profile) ? profile.split(",").map(item => { return profileAccess(item) }) : null,
                    client: (connections) ? connections.split(",").map((item)=>{return parseInt(item)}).filter((id)=>{return id}) : 0
                }

            })

        var exists = 0

        result.forEach(async element => {

            const user = await usersCycle.findOne({login:element.login})

            if(!user){

                console.log(`inserir: ${element.name}`)

                // usersCycle.create(element)
                // .catch(error => {
                //     console.log(error)
                // })

            }else{
                // exists ++;
                console.log(`já existe: ${element.name}`)

                // usersCycle.findOneAndUpdate({login:element.login}, element)
                // .catch(error => {
                //     console.log(error)
                // })

                // console.log(exists)
            }

        });

        return res.status(200).send({total: result.length,result})

    })

}

const sendWelcome = async (req, res, next) => {

    let msg = [];

    usersCycle.find({openPassword: { $exists: true }})
    .then(async users => {

        const result = users.map((user)=>{
            return {
                id: user.name,
                login: user.login,
                openpassword: user.openPassword,
            }
        })

        // users.forEach(async user => {
            
        //     user.email.forEach(email => {
        //         msg.push({
        //             category: 'user.welcome',
        //             to: email.value.replace("/","").trim(),
        //             templateId: process.env.SENDGRID_TEMPLATE_WELCOME,
        //             dynamicTemplateData: {
        //                 subject: `Bem-vindo a sua conta segura`,
        //                 name: user.nickname,
        //                 login: user.login,
        //                 password: user.openPassword,
        //                 email: email.value.replace("/","").trim(),
        //             }
        //         })
        //     });

        // sendGrid.send(msg,true)
        // .then(
        //     response => {
        //         if(!response){
        //             console.log(`Welcome notification error, email not sended!`)
        //         }else{
        //             console.log(`Welcome notification sended!`)
        //         }
        //     }
        // )  

        return res.status(200).send({total: users.length,result})
    })

}

const setStatus = async (req, res, next) => {

    let msg = [];

    usersCycle.find({status: false})
    .then(async users => {

        users.forEach(async user => {
            
            // usersCycle.findOneAndUpdate({login: user.login}, {
            //     status: true,
            //     },
            //     async (err, user) => {

            //         if(err) {
            //         console.log(err)
            //         } else if (user) {
            //         console.log(`atualizado`)
            //         }

            // })

        });

        return res.status(200).send({total: users.length})
    })

}

const usersUpdateConnections = async (req, res, next) => {

    // fs.createReadStream('users.csv')
    //     .pipe(csv())
    //     .on('data', (row)=>{
    //         console.log(row.reference)

    //         usersCycle.findOneAndUpdate({login: row.login}, {
    //             client: [row.reference],
    //         },
    //         async (err, user) => {

    //             if(err) {
    //                 console.log(err)
    //             } else if (user) {
    //                 console.log(`atualizado`)
    //             }
        
    //         })

    //     })
    //     .on('end', () => {
    //         console.log("Csv lido")
    //     })

    return res.status(200).send({total: "ok"})


}

const usersUpdateBlocked = async (req, res, next) => {

    var cc = 0

    // fs.createReadStream('inativos.csv')
    //     .pipe(csv())
    //     .on('data', (row)=>{

    //         console.log(row.login)
    //         cc++
    //         console.log(cc)

    //         usersCycle.findOneAndUpdate({login: row.login}, {
    //             status: false,
    //         },
    //         async (err, user) => {

    //             if(err) {
    //                 console.log(err)
    //             } else if (user) {
    //                 console.log(`inativado`)
    //             }
        
    //         })

    //     })
    //     .on('end', () => {
    //         console.log("Csv lido")
    //     })

    usersCycle.find({openPassword: { $exists: true }})
    .then(async users => {

        const result = users.map((user)=>{
            return {
                nome: user.name,
                login: user.login,
                id: user.client
            }
        })

        return res.status(200).send({total: users.length,result})
    })

    // return res.status(200).send({total: cc})


}

const updateMovideskPersons = async (req, res, next) => {

    // usersCycle.find()
    // .then(async users => {

    //     await users.forEach(async user => {
            
    //         const connections = (user.connections) ? user.connections.split(",").map(connect => {
    //             return {
    //                 "id": ("0000" + connect).slice(-4),
    //                 "forceChildrenToHaveSomeAgreement": false,
    //             }
    //         }) : {}
    
    //         await axios.post(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}`,{
    //             isActive: true,
    //             personType: 1,
    //             profileType: 2,
    //             businessName: user.name,
    //             id: user.login,
    //             emails: user.email.map((email) => { return { emailType: 'Profissional', email: email.value, isDefault: email.primary } }),
    //             relationships: connections
    //         })
    //         .then(response => {
    //             console.log(`Cadastrado: ${user.login}`)
    //         })
    //         .catch(error => {
    //             console.log(`Erro: ${user.login}`)
    //             console.log(error)
    //         })

    //     });

    //     return res.status(200).send({total: users.length, users})
    // })

    // await axios.get(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}&$filter=Emails/any(e: e/email eq 'agenciablackpearl@gmail.com')`)
    await axios.get(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}&id=anderson.dias`)
    .then(async response => {

        const result = response.data

        console.log(result.id)

        // await axios.patch(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}&id=${result.id}`,{
        //     id: result.codeReferenceAdditional
        // })
        // .then(async (response) => {
        //     console.log(response)
        // })
        // .catch(error => {
        //     console.log(error)
        // })

        return res.status(200).send({total: result.length,data: result})
        console.log(response.data)
    })
    .catch(error => {
        return res.status(400).send({error})
        console.log(error)
    })

}

module.exports = {company,updateCompany,updateIuguCompany,updateMovideskCompany,person,sendWelcome,usersUpdateConnections,setStatus,usersUpdateBlocked,updateMovideskPersons}
const pipedrive = require('pipedrive')
const axios = require('axios')

const profileAccess = require('../common/profileAccess')
const usersCycle = require('../users/users')

pipedrive.Configuration.apiToken = process.env.PIPEDRIVE_TOKEN

module.exports = (req, res, next) => {
    const id = req.body.meta.id
    const object = req.body.meta.object
    const action = req.body.meta.action
    const controller = pipedrive.PersonsController

    console.log(id)

    if(action === "updated" && object === "person") {

        axios.get(`https://api.pipedrive.com/v1/persons/${id}?api_token=${process.env.PIPEDRIVE_TOKEN}`)
            .then(response => {
                const { name, first_name, phone, email } = response.data.data
                const login = response.data.data[process.env.PIPEDRIVE_LOGIN_KEY]
                const connections = response.data.data[process.env.PIPEDRIVE_CONNECTION_KEY]
                const dominioUserPass = response.data.data[process.env.PIPEDRIVE_DOMINIO_ATENDIMENTO_KEY]
                const profile = response.data.data[process.env.PIPEDRIVE_PROFILE_KEY] // 95 ADMIN, 96 FINANC, 97 HR, 98 FTAX
                const status = response.data.data[process.env.PIPEDRIVE_STATUS_KEY] // 118 ACTIVE, 119 INACTIVE
                const birthday = response.data.data[process.env.PIPEDRIVE_BIRTHDAY_KEY]

                var input = {};
                input['term'] = login;
                // input['fields'] = ['custom_fields', 'email', 'notes', 'phone', 'name'];
                input['exactMatch'] = true;
                // input['organizationId'] = 58;
                // input['includeFields'] = 'person.picture';
                input['start'] = 0;
                input['limit'] = 50;

                // return res.status(200).send({input})

                controller.searchPersons(input, function(error,response,context) {

                    const persons = response.data.items.filter( person => person.item.custom_fields.includes(login) ).map((person) => { return person.item })

                    persons.forEach(person => {

                        var input = {}
                        input['id'] = person.id
                        input['name'] = name
                        input['email'] = email
                        input['phone'] = phone
                        input[process.env.PIPEDRIVE_PROFILE_KEY] = profile
                        input[process.env.PIPEDRIVE_CONNECTION_KEY] = connections
                        input[process.env.PIPEDRIVE_DOMINIO_ATENDIMENTO_KEY] = dominioUserPass
                        input[process.env.PIPEDRIVE_STATUS_KEY] = status
                        input[process.env.PIPEDRIVE_BIRTHDAY_KEY] = birthday

                        controller.updateAPerson(input, function(error, response, context) {
                            console.log(`Person #${person.id}: ${name} updated`)
                        });

                    })

                    //Atualiza no AD e retorna o usuário
                    usersCycle.findOneAndUpdate({login: login}, {
                        name: name,
                        nickname: first_name,
                        email: email,
                        phone: phone,
                        passwords: {
                            dominio: {
                                user: (dominioUserPass) ? dominioUserPass.split(":")[0] : null,
                                pass: (dominioUserPass) ? dominioUserPass.split(":")[1] : null,
                            },
                        },
                        profile: (profile) ? profile.split(",").map(item => { return profileAccess(item) }) : null,
                        client: (connections) ? connections.split(",") : null,
                        status: (status=="118") ? true : false,
                    },
                    async (err, user) => {
    
                        if(err) {
                            console.log(err)
                        } else if (user) {

                            await axios.patch(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}&id=${login}`,{
                                businessName: name,
                                emails: email.map((email) => { return { emailType: 'Profissional', email: email.value, isDefault: email.primary } })
                            })
                            .then(async (response) => {
                                // console.log(response)
                            })
                            .catch(error => {
                                console.log(error)
                            })
                        }
                
                    })

                    return res.status(200).send({success: ['Person updated']})

                })

                // axios.all([
                //     axios.get(`https://api.pipedrive.com/v1/persons/search?term=${login}&api_token=${process.env.PIPEDRIVE_TOKEN}`),
                // ])
                // .then(axios.spread((pipedrive) => {

                //     const persons = pipedrive.data.data.items.filter( person => person.item.custom_fields.includes(login) ).map((person) => { return person.item })

                //     // //Atualiza primeiro no Pipedrive
                //     // persons.forEach(person => {
                //     //     if(person.id != id) {
                //     //         //Chamada axios para enviar alterações
                //     //         axios.put(`https://api.pipedrive.com/v1/persons/${person.id}?api_token=${process.env.PIPEDRIVE_TOKEN}`, {
                //     //             name: name,
                //     //             email: email,
                //     //             phone: phone,
                //     //             [process.env.PIPEDRIVE_PROFILE_KEY]: profile,
                //     //             [process.env.PIPEDRIVE_CONNECTION_KEY]: connections,
                //     //             [process.env.PIPEDRIVE_DOMINIO_ATENDIMENTO_KEY]: dominioUserPass,
                //     //             [process.env.PIPEDRIVE_STATUS_KEY]: status,
                //     //             [process.env.PIPEDRIVE_BIRTHDAY_KEY]: birthday,
                //     //         })
                //     //         .then((response) => {
                //     //             console.log(response.data)
                //     //         })

                //     //     }
                //     // })

                //     //Atualiza no AD e retorna o usuário
                //     usersCycle.findOneAndUpdate({login: login}, {
                //         name: name,
                //         nickname: first_name,
                //         email: email,
                //         phone: phone,
                //         passwords: {
                //             dominio: {
                //                 user: (dominioUserPass) ? dominioUserPass.split(":")[0] : null,
                //                 pass: (dominioUserPass) ? dominioUserPass.split(":")[1] : null,
                //             },
                //         },
                //         profile: (profile) ? profile.split(",").map(item => { return profileAccess(item) }) : null,
                //         client: (connections) ? connections.split(",") : null,
                //         status: (status=="118") ? true : false,
                //     },
                //     async (err, user) => {
    
                //         if(err) {
                //             console.log(err)
                //         } else if (user) {

                //             await axios.patch(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}&id=${login}`,{
                //                 businessName: name,
                //                 emails: email.map((email) => { return { emailType: 'Profissional', email: email.value, isDefault: email.primary } })
                //             })
                //             .then(async (response) => {
                //                 // console.log(response)
                //             })
                //             .catch(error => {
                //                 console.log(error)
                //             })
                //         }
                
                //     })

                //     return res.status(200).send({success: ['Person updated']})

                // }))
                // .catch(error => {
                //     console.log(error)
                //     return res.status(400).send({errors: error})
                // })

            })

    }else{
        return res.status(200).send({errors: ['Not a person call.']})
    }

}
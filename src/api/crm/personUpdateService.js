const axios = require('axios')

const usersCycle = require('../users/users')

module.exports = (req, res, next) => {
    const id = req.body.meta.id
    const object = req.body.meta.object
    const action = req.body.meta.action

    if(action === "updated" && object === "person") {

        axios.get(`https://api.pipedrive.com/v1/persons/${id}?api_token=${process.env.PIPEDRIVE_TOKEN}`)
            .then(response => {
                const { name, first_name, phone, email } = response.data.data
                const login = response.data.data[process.env.PIPEDRIVE_LOGIN_KEY]
                const connections = response.data.data[process.env.PIPEDRIVE_CONNECTION_KEY]
                const dominioUserPass = response.data.data[process.env.PIPEDRIVE_DOMINIO_ATENDIMENTO_KEY]
                const contaAzulUserPass = response.data.data[process.env.PIPEDRIVE_CONTA_AZUL_KEY]
                const profile = response.data.data[process.env.PIPEDRIVE_PROFILE_KEY] // 95 ADMIN, 96 FINANC, 97 HR, 98 FTAX

                axios.all([
                    axios.get(`https://api.pipedrive.com/v1/persons/search?term=${login}&api_token=${process.env.PIPEDRIVE_TOKEN}`),
                ])
                .then(axios.spread((pipedrive) => {

                    const persons = pipedrive.data.data.items.filter( person => person.item.custom_fields.includes(login) ).map((person) => { return person.item })

                    //Atualiza primeiro no Pipedrive
                    persons.forEach(person => {
                        if(person.id != id) {
                            //Chamada axios para enviar alterações
                            axios.put(`https://api.pipedrive.com/v1/persons/${person.id}?api_token=${process.env.PIPEDRIVE_TOKEN}`, {
                                name: name,
                                email: email,
                                phone: phone,
                                [process.env.PIPEDRIVE_PROFILE_KEY]: profile,
                                [process.env.PIPEDRIVE_CONNECTION_KEY]: connections,
                                [process.env.PIPEDRIVE_CONTA_AZUL_KEY]: contaAzulUserPass,
                                [process.env.PIPEDRIVE_DOMINIO_ATENDIMENTO_KEY]: dominioUserPass
                            })
                            .then((response) => {
                                console.log(response.data)
                            })

                        }
                    })

                    console.log(dominioUserPass.split(":")[0])

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
                            conta_azul: {
                                user: (contaAzulUserPass) ? contaAzulUserPass.split(":")[0] : null,
                                pass: (contaAzulUserPass) ? contaAzulUserPass.split(":")[1] : null,
                            },
                        },
                        profile: "ADMIN",
                        client: connections.split(","),
                    },
                    (err, user) => {
    
                        if(err) {
                            console.log(err)
                        } else if (user) {
                            console.log(user)
                            //Atualiza no Movidesk com base no id registrado no AD se houver
                            // return res.status(400).send({errors: ['Login already in use.']})
                        }
                
                    })

                    return res.status(200).send({success: ['Person updated']})

                }))
                .catch(error => {
                    return res.status(400).send({errors: error})
                })

            })

    }else{
        return res.status(200).send({errors: ['Not a person call.']})
    }

}
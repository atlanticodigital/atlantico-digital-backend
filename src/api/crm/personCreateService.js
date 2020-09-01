const env = require('../../.env')
const axios = require('axios')

const usersCycle = require('../users/users')

module.exports = (req, res, next) => {
    const id = req.body.meta.id
    const object = req.body.meta.object
    const action = req.body.meta.action

    if(action === "added" && object === "person") {

        axios.get(`https://api.pipedrive.com/v1/persons/${id}?api_token=${env.pipeDriveApiToken}`)
            .then(response => {
                const { name, first_name, phone, email } = response.data.data
                const login = response.data.data[env.pipeDriveLoginKey]
                const connections = response.data.data[env.pipeDriveConnectionKey]
                const dominioUserPass = response.data.data[env.pipeDriveDominioAtendimentoKey]
                const contaAzulUserPass = response.data.data[env.pipeDriveContaAzulKey]
                const profile = response.data.data[env.pipeDriveProfileKey] // 95 ADMIN, 96 FINANC, 97 HR, 98 FTAX

                usersCycle.findOne({login}, (err, user) => {
    
                    if(err) {
                        // Enviar notificação Dev
                        return res.status(200).send({errors: ['Find login error.']})
                    } else if (user) {
                        // Enviar notificação CX e Dev
                        return res.status(400).send({errors: ['Login already in use.']})
                    } else {

                        //Cadastra no Movidesk

                        //Cadastra no MailChimp
                        
                        //Add user in AD
                        
                        return res.status(200).send({success: ['Person created']})

                    }
            
                })
            })

    }else{
        return res.status(200).send({errors: ['Not a person call.']})
    }

}
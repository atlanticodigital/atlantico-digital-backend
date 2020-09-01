const env = require('../../.env')
const axios = require('axios')

const usersCycle = require('../users/users')

module.exports = (req, res, next) => {
    const id = req.body.meta.id
    const object = req.body.meta.object
    const action = req.body.meta.action

    if(action === "updated" && object === "organization") {

        axios.get(`https://api.pipedrive.com/v1/organizations/${id}?api_token=${env.pipeDriveApiToken}`)
            .then(response => {
                const { name } = response.data.data

                //Atualiza empresa no AD e Movidesk
                //Atualiza no Iugu

            })

    }else{
        return res.status(200).send({errors: ['Not a organization call.']})
    }

}
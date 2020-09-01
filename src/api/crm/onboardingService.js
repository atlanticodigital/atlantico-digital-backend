const env = require('../../.env')
const axios = require('axios')

const onboardingProcess = require('./onboardingProcess')

module.exports = (req, res, next) => {
    const id = req.body.meta.id
    const object = req.body.meta.object
    const action = req.body.meta.action

    if(action === "updated" && object === "deal") {

        axios.get(`https://api.pipedrive.com/v1/deals/${id}?api_token=${env.pipeDriveApiToken}`)
            .then(response => {
                const { status, value, person_id, org_id } = response.data.data      

                if( status === "won" ){

                    if(org_id.value&&person_id.value){

                        axios.all([
                            axios.get(`https://api.pipedrive.com/v1/persons/${person_id.value}?api_token=${env.pipeDriveApiToken}`),
                            axios.get(`https://api.pipedrive.com/v1/organizations/${org_id.value}?api_token=${env.pipeDriveApiToken}`),
                            axios.get(`https://api.pipedrive.com/v1/deals/${id}/products/?api_token=${env.pipeDriveApiToken}`),
                        ])
                        .then(axios.spread((response1, response2, response3) => {
                            
                            onboardingProcess(res, response, response1, response2, response3)
                            
                        }))
                        .catch(error => {
                            return res.status(400).send({errors: error})
                        })

                    }

                    // res.json(person_id)
                }else{
                    return res.status(200).send({errors: ['Not a won deal.']})
                }
                
            })
            .catch(error => {
                return res.status(400).send({errors: error})
            });

    }else{
        return res.status(200).send({errors: ['Not a deal call.']})
    }

}
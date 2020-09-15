const axios = require('axios')

const User = require('./users')

module.exports = async (req, res, next) => {
    const response = res.locals.bundle
    
    await axios.get(`https://api.pipedrive.com/v1/persons/search?term=${response.login}&api_token=${process.env.PIPEDRIVE_TOKEN}`)
    .then(async (pipedrive) => {

        const persons = await pipedrive.data.data.items.filter( person => person.item.custom_fields.includes(response.login) ).map((person) => { return person.item })

        for (const [index, person] of persons.entries()){

            axios.put(`https://api.pipedrive.com/v1/persons/${person.id}?api_token=${process.env.PIPEDRIVE_TOKEN}`, {
                name: response.name,
                email: response.email,
                phone: response.phone
            })
            .then(async (person) => {
                // console.log(person.data.data)

                await User.findOneAndUpdate({_id: response._id}, {
                    nickname: person.data.data.first_name
                },
                (err, user) => {

                    if(err) {
                        console.log(err)
                    } else if (user) {
                        console.log(user)
                    }
            
                })

            })
            .catch(error => {
                console.log(error)
            })
            
        }

    })
    .catch(error => {
        console.log(error)
    })

    await axios.patch(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}&id=${response.login}`,{
        businessName: response.name,
        emails: response.email.map((email) => { return { emailType: 'Profissional', email: email.value, isDefault: email.primary } })
    })
    .then(async (response) => {
        // console.log(response)
    })
    .catch(error => {
        console.log(error)
    })

    next()
    
}
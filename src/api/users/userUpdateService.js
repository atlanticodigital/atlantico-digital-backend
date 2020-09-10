const axios = require('axios')

module.exports = async (req, res, next) => {
    const response = res.locals.bundle
    
    await axios.get(`https://api.pipedrive.com/v1/persons/search?term=${response.login}&api_token=${process.env.PIPEDRIVE_TOKEN}`)
    .then(async (pipedrive) => {

        const persons = await pipedrive.data.data.items.filter( person => person.item.custom_fields.includes(response.login) ).map((person) => { return person.item })

        for (const [index, person] of persons.entries()){

            console.log(person.id)

            axios.put(`https://api.pipedrive.com/v1/persons/${person.id}?api_token=${process.env.PIPEDRIVE_TOKEN}`, {
                name: response.name,
                email: response.email,
                phone: response.phone
            })
            .then((response) => {
                console.log(response)
            })
            .catch(error => {
                console.log(error)
            })
            
        }

    })
    .catch(error => {
        console.log(error)
    })

    next()
    
}
const axios = require('axios')
const bcrypt = require('bcrypt')

const passwordRegex = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%]).{6,20})/

module.exports = async (req, res, next) => {
    const response = res.locals.bundle

    const password = req.body.password || null

    if(password){
        if(!password.match(passwordRegex)) {
            return res.status(400).send({errors: [
                "Password must be 6-20 characters and numbers. Must have symbols (@#$%) one uppercase letter and one lowercase letter."
            ]})
        }
    
        const salt = bcrypt.genSaltSync()
        const passwordHash = bcrypt.hashSync(password, salt)
        
        req.body.password = passwordHash
    }
    
    await axios.get(`https://api.pipedrive.com/v1/persons/search?term=${response.login}&api_token=${process.env.PIPEDRIVE_TOKEN}`)
    .then(async (pipedrive) => {

        const persons = await pipedrive.data.data.items.filter( person => person.item.custom_fields.includes(response.login) ).map((person) => { return person.item })

        for (const [index, person] of persons.entries()){

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

    await axios.patch(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}&id=${response.login}`,{
        businessName: response.name,
        emails: response.email.map((email) => { return { emailType: 'Profissional', email: email.value, isDefault: email.primary } })
    })
    .then(async (response) => {
        console.log(response)
    })
    .catch(error => {
        console.log(error)
    })

    next()
    
}
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const send = async (data,multiple=false) => {

    let msg;

    let defaults = {
        from: {
            email: 'naoresponda@atlantico.digital',
            name: 'Atlântico Digital'
        },
        reply_to: {
            email: 'cx@atlantico.digital',
            name: 'Experiência do Cliente'
        },
    }

    if(multiple){
        msg = data.map(element => { 
            return Object.assign(element, defaults)
        })
    }else{
        msg = Object.assign(data, defaults)
    }

    try {
        await sgMail.send(msg)

        return true
    } catch (error) {
        console.error(error);

        if (error.response) {
            console.error(error.response.body)
        }

        return false
    }

}

module.exports = { send }
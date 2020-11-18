const axios = require('axios')
const bcrypt = require('bcrypt')

const usersCycle = require('../users/users')
const clientsCycle = require('../clients/clients')
const cpfCnpj = require('../common/cpfCnpj')
const profileAccess = require('../common/profileAccess')
const sendGrid = require('../common/sendGrid')
const generator = require('generate-password')

const movidesk = async (data) => {

    return axios.post(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}`,{
        isActive: true,
        personType: 2,
        profileType: 2,
        corporateName: data.organizationName,
        businessName: data.organizationName,
        id: data.reference
    })
    .then(response => {

        return axios.post(`https://api.movidesk.com/public/v1/persons?token=${process.env.MOVIDESK_TOKEN}`,{
            isActive: true,
            personType: 1,
            profileType: 2,
            businessName: data.name,
            id: data.login,
            emails: data.email.map((email) => { return { emailType: 'Profissional', email: email.value, isDefault: email.primary } }),
            relationships: [
                {
                    "id": data.reference,
                    "forceChildrenToHaveSomeAgreement": false,
                }
            ]
        })
        .then(response => {
            return true
        })
        .catch(error => {
            return false
        })
        
    })
    .catch(error => {
        return false
    })

}

const runrunit = async (data) => {

    const headers = {
        'Content-Type': 'application/json',
        'App-Key': process.env.RUNRUNIT_TOKEN,
        'User-Token': process.env.RUNRUNIT_USER_TOKEN,
    }

    return axios.post(`https://runrun.it/api/v1.0/clients`,{
        client: {
            name: data.organizationName,
            is_visible: true,
            profileType: 2,
            budgeted_cost_month: "0.0",
            budgeted_hours_month: 0
        }
    }, { headers: headers })
    .then(async (response) => {

        const runrunit_id = response.data.id
        const runrunit_projects = []

        const promises = data.dealProducts.map(async (product, index) => {

            await axios.post(`https://runrun.it/api/v1.0/projects`,{
                project: {
                    name: product.description,
                    client_id: runrunit_id
                }
            }, { headers: headers })
            .then(response => {

                runrunit_projects.push(response.data.id)
                
            })
            .catch(error => {
                runrunit_projects.push(false)
            })

        })

        await Promise.all(promises)

        return { runrunit_id, runrunit_projects }
        
    })
    .catch(error => {
        return false
    })

}

const iugu = async (data) => {

    let buff = new Buffer.from(process.env.IUGU_TOKEN)
    let base64data = buff.toString('base64')

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${base64data}:`
    }
    
    return axios.post(`https://api.iugu.com/v1/customers`,{
        email: data.email[0].value,
        name: data.organizationName,
        cpf_cnpj: data.document.replace(/[-./ ]/g,''), //Only numbers
        zip_code: data.address_postal_code,
        number: data.address_street_number
    }, { headers: headers })
    .then(response => {
        
        const iugu_id = response.data.id

        return axios.post(`https://api.iugu.com/v1/invoices`,{
            email: data.email[0].value,
            due_date: data.firstDueDate, //AAAA-MM-DD
            items: data.dealProducts,
            customer_id: iugu_id,
            payer: {
                name: data.organizationName,
                cpf_cnpj: data.document.replace(/[.-/ ]/g,''), //Only numbers
                address: {
                    zip_code: data.address_postal_code,
                    number: data.address_street_number
                }
            }
        }, { headers: headers })
        .then(response => {

            return { iugu_id }
            
        })
        .catch(error => {
            console.log(error.response.data)
            return false
        })

        
    })
    .catch(error => {
        return false
    })

}

module.exports = async (id, res, deal, person, organization, products) => {
    let errors = []

    // Person data
    const { name, first_name, phone, email } = person.data.data
    const login = person.data.data[process.env.PIPEDRIVE_LOGIN_KEY]
    const birthday = person.data.data[process.env.PIPEDRIVE_BIRTHDAY_KEY]
    const dominioUserPass = person.data.data[process.env.PIPEDRIVE_DOMINIO_ATENDIMENTO_KEY]
    const contaAzulUserPass = person.data.data[process.env.PIPEDRIVE_CONTA_AZUL_KEY]
    let profile = person.data.data[process.env.PIPEDRIVE_PROFILE_KEY] // 95 ADMIN, 96 FINANC, 97 HR, 98 FTAX
    profile = profile ? profile.split(",") : profile

    // Organization data
    const organizationName = organization.data.data["name"] //Client name
    const { address_postal_code, address_street_number } = organization.data.data
    let reference = organization.data.data[process.env.PIPEDRIVE_CLIENT_KEY] //Client major reference
    const document = organization.data.data[process.env.PIPEDRIVE_DOCUMENT_KEY] //Client CNPJ
    const firstDueDate = organization.data.data[process.env.PIPEDRIVE_DUEDATE_KEY] //Due date
    const organizationNickName = organization.data.data[process.env.PIPEDRIVE_ORGANIZATION_NICKNAME_KEY] //Organization Nickname
    const payroll = organization.data.data[process.env.PIPEDRIVE_PAYROLL_KEY] //Payroll

    //Document validation
    if(!document||!cpfCnpj(document)){
        errors.push('CNPJ inválido ou em branco!')
    }

    //Reference validation
    if(!reference){
        errors.push('Código do cliente em branco!')
    }

    //Postal Code validation
    if(!address_postal_code){
        errors.push('Nenhum Cep informado na organização!')
    }

    //Address Number validation
    if(!address_street_number){
        errors.push('Nenhum número informado para o endereço da organização!')
    }

    //First Due Date validation
    if(!firstDueDate){
        errors.push('Data do primeiro vencimento em branco!')
    }

    //E-mail validation
    if(!email||!email[0]["value"]){
        errors.push('Nenhum e-mail informado para o contato!')
    }

    //Birthday validation
    if(!birthday){
        errors.push('Data de nascimento do contato em branco!')
    }

    //Profile validation
    if(!profile){
        errors.push('Nenhum nível de permissão selecionado para o contato!')
    }

    //Products validation
    if(!products.data.data){
        errors.push('Nenhum produto vinculado ao negócio!')
    }

    const verifyLogin = await usersCycle.findOne({login})

    if(await verifyLogin){
        errors.push(`O Id do usuário já está em uso: ${login}`)
    }

    reference = parseInt(reference)

    const verifyReference = await clientsCycle.findOne({reference})

    if(await verifyReference){
        errors.push(`O código do cliente informado já está em uso: ${reference}`)
    }

    //Return 200 if there is any error
    if(errors.length){
        let msg = {
            to: ["agenciablackpearl@gmail.com","minhaexperiencia@atlantico.digital"],
            templateId: process.env.SENDGRID_TEMPLATE_ERRORS,
            dynamicTemplateData: {
                subject: `Falha no onboarding #${id}`,
                title: "Falha no processo onboarding",
                description: `Ao realizar a validação de dados para o processo onboarding do negócio #${id}, ocorreram os erros listados abaixo.`,
                errors,
            }
        }

        sendGrid.send(msg)
        .then(
            response => {
                if(!response){
                    console.log(`Onboarding #${id} notification error email not sended!`)
                }else{
                    console.log(`Onboarding #${id} notification sended!`)
                }
            }
        )     

        return res.status(200).send({msg: ['Erro no processo onboarding.'], errors: errors})
    }
    //In case there is no error, proceed to register client and user
    else{
        errors = []
        
        //Deal data
        // const totalProducts = (Math.round(deal.data.data["value"] * 100) / 100).toFixed(2).replace(".","")

        const dealProducts = products.data.data.map((product) => { return {
            description: product.name,
            quantity: product.quantity,
            price_cents: (Math.round(product.item_price * 100) / 100).toFixed(2).replace(".",""),
            }
        })

        let runrunit_id,
            runrunit_projects,
            iugu_id

        const movideskSignUp = await movidesk({name, email, login, organizationName, reference})
    
        if(!await movideskSignUp){
            errors.push(`Não foi possível cadastrar o cliente no movidesk.`)
        }
    
        const runrunSignUp = await runrunit({ dealProducts, organizationName })
    
        if(!await runrunSignUp){
            errors.push(`Não foi possível cadastrar o cliente no runrunit.`)
        }else{
            runrunit_id = runrunSignUp.runrunit_id
            runrunit_projects = runrunSignUp.runrunit_projects
        }
    
        const iuguSignUp = await iugu({ email, organizationName, document, address_postal_code, address_street_number, firstDueDate, dealProducts })
    
        if(!await iuguSignUp){
            errors.push(`Não foi possível cadastrar o cliente no iugu.`)
        }else{
            iugu_id= iuguSignUp.iugu_id
        }

        try {

            //Create client
            clientsCycle.create({
                name: organizationName,
                nickname: organizationNickName,
                reference: reference,
                document: document,
                payroll: payroll=="116" ? true : false,
                runrunit_id,
                runrunit_projects,
                iugu_id,
            })

            //Generate random password
            const password = generator.generate({
                length: 10,
                numbers: true,
                symbols: true,
                lowercase: true,
                uppercase: true,
                excludeSimilarCharacters: true,
                strict: true,
            })

            const salt = bcrypt.genSaltSync()
            const passwordHash = bcrypt.hashSync(password, salt)

            //Create user
            usersCycle.create({
                name,
                nickname: first_name,
                login,
                password: passwordHash,
                is_admin: false,
                email,
                phone,
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
                agreed: true,
                status: true,
                profile: profile.map(item => { return profileAccess(item) }),
                client: [ reference ]
            })

            let msg = [];

            email.forEach(email => {
                msg.push({
                    to: email.value,
                    templateId: process.env.SENDGRID_TEMPLATE_WELCOME,
                    dynamicTemplateData: {
                        subject: `Bem-vindo a sua conta segura`,
                        name: first_name,
                        login,
                        password,
                        email: email.value,
                    }
                })
            });
    
            sendGrid.send(msg,true)
            .then(
                response => {
                    if(!response){
                        console.log(`Onboarding #${id} welcome notification error, email not sended!`)
                    }else{
                        console.log(`Onboarding #${id} welcome notification sended!`)
                    }
                }
            )     
            
            return res.json("OK")

        } catch (error) {
            errors.push(`Não foi possível cadastrar o cliente no atlântico.digital.`)
        }

        if(errors.length){
            let msg = {
                to: ["agenciablackpearl@gmail.com","minhaexperiencia@atlantico.digital"],
                templateId: process.env.SENDGRID_TEMPLATE_ERRORS,
                dynamicTemplateData: {
                    subject: `Pendências no onboarding #${id}`,
                    title: "Pendências no processo onboarding",
                    description: `Ao realizar o processo onboarding do negócio #${id} em nossos sistemas, ocorreram as pendências listadas abaixo.`,
                    errors,
                }
            }
    
            sendGrid.send(msg)
            .then(
                response => {
                    if(!response){
                        console.log(`Onboarding #${id} pendencies notification error email not sended!`)
                    }else{
                        console.log(`Onboarding #${id} pendencies notification sended!`)
                    }
                }
            )     

            return res.status(200).send({msg: ['Onboarding pendencies error.'], errors: errors})
        }

    }

}
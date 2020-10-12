const express = require('express')
const auth = require('./auth')

module.exports = (server) => {

    const protectedApi = express.Router()
    server.use('/v1', protectedApi)

    protectedApi.use(auth)

    const UsersCycle = require('../api/users/usersService')
    UsersCycle.register(protectedApi, '/users')

    const ClientsCycle = require('../api/clients/clientsService')
    ClientsCycle.register(protectedApi, '/clients')

    const TicketsOptionsCycle = require('../api/helpdesk/ticketOptionsService')
    TicketsOptionsCycle.register(protectedApi, '/tickets/options')

    const tasksTypesCycle = require('../api/tasks/tasksTypesService')
    tasksTypesCycle.register(protectedApi, '/tasks')

    const DocumentService = require('../api/clients/clientDocument')
    protectedApi.get('/document/:document',DocumentService.request)

    // Open Api
    const openApi = express.Router()
    server.use('/oauth', openApi)

    const AuthService = require('../api/users/authService')
    openApi.post('/', AuthService.login)
    openApi.post('/forgot', AuthService.forgot)
    openApi.post('/recover', AuthService.recover)
    openApi.post('/validateToken', AuthService.validateToken)

    const OnBoardingService = require('../api/crm/onboardingService')
    openApi.post('/onboarding', OnBoardingService)

    const PersonUpdateService = require('../api/crm/personUpdateService')
    openApi.post('/person/update', PersonUpdateService)

    const tasksService = require('../api/tasks/tasksService')
    openApi.post('/tasks', tasksService.notify)

    const prospectService = require('../api/users/prospectService')
    const loginPassHandler = require('../api/users/loginPassHandler')

    openApi.post('/prospect', prospectService.prepare, loginPassHandler, prospectService.newProspect, AuthService.login)

}
const express = require('express')
const auth = require('./auth')

module.exports = (server) => {

    const protectedApi = express.Router()
    server.use('/v1', protectedApi)

    protectedApi.use(auth)

    const UsersCycle = require('../api/users/usersService')
    UsersCycle.register(protectedApi, '/users')

    // Open Api
    const openApi = express.Router()
    server.use('/oauth', openApi)

    const AuthService = require('../api/users/authService')
    openApi.post('/', AuthService.login)
    openApi.post('/validateToken', AuthService.validateToken)

    const OnBoardingService = require('../api/crm/onboardingService')
    openApi.post('/onboarding', OnBoardingService)

    const PersonUpdateService = require('../api/crm/personUpdateService')
    openApi.post('/person/update', PersonUpdateService)

}
const usersCycle = require('./users')

const errorHandler = require('../common/errorHandler')
const loginPassHandler = require('./loginPassHandler')
const changePasswordService = require('./changePasswordService')
const usersClientsService = require('./userClientsService')
const userUpdateService = require('./userUpdateService')
const newTicketService = require('../helpdesk/newTicketService')

usersCycle.methods(['get', 'post', 'put', 'delete'])
usersCycle.updateOptions({ new: true, runValidators: true })
usersCycle.after('post', errorHandler).after('put', errorHandler).after('put', userUpdateService)
usersCycle.before('post', loginPassHandler)

usersCycle.route('clients', {
    detail: true,
    handler: usersClientsService
})

usersCycle.route('changePassword', {
    detail: true,
    handler: changePasswordService
})

usersCycle.route('tickets.post', {
    detail: true,
    handler: newTicketService
})

module.exports = usersCycle
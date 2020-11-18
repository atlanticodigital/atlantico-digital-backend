const usersCycle = require('./users')

const errorHandler = require('../common/errorHandler')
const loginPassHandler = require('./loginPassHandler')
const changePasswordService = require('./changePasswordService')
const usersClientsService = require('./userClientsService')
const userUpdateService = require('./userUpdateService')
const newTicketService = require('../helpdesk/newTicketService')
const tasksService = require('../tasks/tasksService')
const notificationsService = require('../notifications/notificationsService')

usersCycle.methods(['get', 'post', 'put', 'delete'])
usersCycle.updateOptions({ new: true, runValidators: true })
usersCycle.after('post', errorHandler).after('put', errorHandler).after('put', userUpdateService)
usersCycle.before('post', loginPassHandler)

usersCycle.route('clients', { detail: true, handler: usersClientsService.clients })

usersCycle.route('changePassword', { detail: true, handler: changePasswordService })

usersCycle.route('tickets.post', { detail: true, handler: newTicketService })
usersCycle.route('notifications.get', { detail: true, handler: notificationsService.list })
usersCycle.route('notifications.put', { detail: true, handler: notificationsService.read })

usersCycle.route('request.post', { detail: true, handler: usersClientsService.newContact })
usersCycle.route('welcome.put', { detail: true, handler: usersClientsService.welcomeEmailResend })

usersCycle.route('downloadTaskDocument.get', { detail: true, handler: tasksService.download })
usersCycle.route('downloadTaskZipDocuments.get', { detail: true, handler: tasksService.downloadZip })

module.exports = usersCycle
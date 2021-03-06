const clientsCycle = require('../clients/clients')
const errorHandler = require('../common/errorHandler')

const clientInvoicesService = require('./clientInvoicesService')
const tasksService = require('../tasks/tasksService')
const usersClientsService = require('../users/userClientsService')
const clientsGroup = require('./clientsGroups')
const clientDocument = require('./clientDocument')

const filesService = require('../files/filesService')
const legacyService = require('../files/legacyService')

clientsCycle.methods(['get', 'post', 'put', 'delete'])
clientsCycle.updateOptions({ new: true, runValidators: true })
clientsCycle.after('post', errorHandler).after('put', errorHandler)

clientsCycle.route('invoices.get', { detail: true, handler: clientInvoicesService.list })
clientsCycle.route('invoice.get', clientInvoicesService.query)

clientsCycle.route('tasks.get', { detail: true, handler: tasksService.list })
clientsCycle.route('task.get', tasksService.show)
clientsCycle.route('taskSearch.get', { detail: true, handler: tasksService.search })
clientsCycle.route('taskDocuments.get', tasksService.query)

clientsCycle.route('contacts.get', { detail: true, handler: usersClientsService.contacts })

clientsCycle.route('filesList.get', { detail: true, handler: filesService.list })
clientsCycle.route('legacyList.get', { detail: true, handler: legacyService.list })
clientsCycle.route('newFolder.post', { detail: true, handler: filesService.newFolder })
clientsCycle.route('deleteObject.delete', { detail: true, handler: filesService.deleteObject })
clientsCycle.route('upload.post', { detail: true, handler: filesService.upload })
clientsCycle.route('lastUploads.get', { detail: true, handler: filesService.lastUploads })
clientsCycle.route('downloadUrl.get', { detail: true, handler: filesService.download })

clientsCycle.route('group.get', { detail: true, handler: clientsGroup.list })
clientsCycle.route('document.get', { detail: true, handler: clientDocument.receitaWs })

module.exports = clientsCycle
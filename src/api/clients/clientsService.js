const clientsCycle = require('../clients/clients')
const errorHandler = require('../common/errorHandler')

const clientInvoicesService = require('./clientInvoicesService')
const tasksService = require('../tasks/tasksService')

clientsCycle.methods(['get', 'post', 'put', 'delete'])
clientsCycle.updateOptions({ new: true, runValidators: true })
clientsCycle.after('post', errorHandler).after('put', errorHandler)

clientsCycle.route('invoices.get', {
    detail: true,
    handler: clientInvoicesService.list
})

clientsCycle.route('invoice.get', clientInvoicesService.query)

clientsCycle.route('tasks.get', {
    detail: true,
    handler: tasksService.list
})

clientsCycle.route('task.get', tasksService.show)
clientsCycle.route('taskDocuments.get', tasksService.query)

module.exports = clientsCycle
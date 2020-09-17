const clientsCycle = require('../clients/clients')
const errorHandler = require('../common/errorHandler')

const clientInvoicesService = require('./clientInvoicesService')

clientsCycle.methods(['get', 'post', 'put', 'delete'])
clientsCycle.updateOptions({ new: true, runValidators: true })
clientsCycle.after('post', errorHandler).after('put', errorHandler)

clientsCycle.route('invoices.get', {
    detail: true,
    handler: clientInvoicesService.list
})

clientsCycle.route('invoice.get', clientInvoicesService.query);

module.exports = clientsCycle
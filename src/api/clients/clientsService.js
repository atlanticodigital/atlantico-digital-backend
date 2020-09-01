const clientsCycle = require('../clients/clients')
const errorHandler = require('../common/errorHandler')
const bcrypt = require('bcrypt')

clientsCycle.methods(['get', 'post', 'put', 'delete'])
clientsCycle.updateOptions({ new: true, runValidators: true })
clientsCycle.after('post', errorHandler).after('put', errorHandler)

module.exports = clientsCycle
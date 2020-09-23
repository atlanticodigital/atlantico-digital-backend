const ticketCycle = require('./ticketOptions')

const errorHandler = require('../common/errorHandler')

ticketCycle.methods(['get', 'post', 'put'])
ticketCycle.updateOptions({ new: true, runValidators: true })
ticketCycle.after('post', errorHandler).after('put', errorHandler)

module.exports = ticketCycle
const tasksTypesCycle = require('./tasksTypes')

const errorHandler = require('../common/errorHandler')

tasksTypesCycle.methods(['get', 'post', 'put', 'delete'])
tasksTypesCycle.updateOptions({ new: true, runValidators: true })
tasksTypesCycle.after('post', errorHandler).after('put', errorHandler)

module.exports = tasksTypesCycle
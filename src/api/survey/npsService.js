const npsCycle = require('./nps')

const errorHandler = require('../common/errorHandler')

npsCycle.methods(['get', 'post', 'put', 'delete'])
npsCycle.updateOptions({ new: true, runValidators: true })
npsCycle.after('post', errorHandler).after('put', errorHandler)


module.exports = npsCycle
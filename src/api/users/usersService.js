const usersCycle = require('./users')
const errorHandler = require('../common/errorHandler')
const loginPassHandler = require('../common/loginPassHandler')
const bcrypt = require('bcrypt')

usersCycle.methods(['get', 'post', 'put', 'delete'])
usersCycle.updateOptions({ new: true, runValidators: true })
usersCycle.after('post', errorHandler).after('put', errorHandler)
usersCycle.before('post', loginPassHandler)

module.exports = usersCycle
require('dotenv').config({ path: './src/.env' })

const server = require('./config/server')

require('./config/database')
require('./config/routes')(server)
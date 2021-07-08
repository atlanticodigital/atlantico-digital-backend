const port = process.env.PORT || 3003

const bodyParser = require('body-parser')
const express = require('express')
const server = express()
const allowCors = require('./cors')

server.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))
server.use(bodyParser.json({ limit: '100mb' }))
server.use(allowCors)

server.listen(port, () => {
    console.log(`BACKEND is running on port ${port}.`)
})

module.exports = server
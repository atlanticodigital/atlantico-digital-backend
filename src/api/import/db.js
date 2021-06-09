const mysql = require('mysql2/promise')

module.exports = async () => {

    if(global.connection && global.connection.state !== 'disconnected')
    return global.connection

    const connection = await mysql.createConnection("mysql://root:perolaID@1346@localhost:3306/atlantic_digital")
    console.log("conectou")

    global.connection = connection
    return connection

}
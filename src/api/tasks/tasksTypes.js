const restful = require('node-restful')
const mongoose = restful.mongoose

const types = new mongoose.Schema({
    name: { type: String, required: [true, 'Informe o nome do tipo da tarefa!'] },
    runrunit_id: { type: Number, required: [true, 'Informe o id do tipo da tarefa!'] },
    runrunit_team_id: Number,
    upload_date: Number,
    desired_date: Number,
    visible: { type: Boolean, default: true },
    profile: String,
})

module.exports = restful.model('Tasks_types', types)
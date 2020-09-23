const restful = require('node-restful')
const mongoose = restful.mongoose

const tasks = new mongoose.Schema({
    client: mongoose.Schema.Types.ObjectId,
    task_id: { type: Number, required: [true, 'Informe o id da tarefa!'] },
    response: Object,
    documents: Object,
    created_at: { type: Date, default: Date.now() },
    closed_at: { type: Date }
})

module.exports = restful.model('Runrunit_tasks', tasks)
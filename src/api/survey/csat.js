const restful = require('node-restful')
const mongoose = restful.mongoose

const csat = new mongoose.Schema({
    client: mongoose.Schema.Types.ObjectId,
    user: mongoose.Schema.Types.ObjectId,
    task: { type: Number, required: [true, 'Informe o id da tarefa!'] },
    answer: { 
        type: String,
        enum : [ 'very_dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very_satisfied' ]
    },
    answered_at: { type: Date, default: Date.now() },
    comments: { type: String, default: null },
})

module.exports = restful.model('survey_csat', csat)
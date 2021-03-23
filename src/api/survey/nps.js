const restful = require('node-restful')
const mongoose = restful.mongoose

const nps = new mongoose.Schema({    
    title: { type: String, required: [true, "Survey's title required!"] },
    option: { 
        type: String,
        enum: ['Link de Compartilhamento', 'App e Webapp'], 
    },
    questions: [ String ],
    active: Boolean,
    priority: Boolean,
    created_at: { type: Date, default: new Date() },
    published_up: {type: Date},
    published_down: {type: Date},
})

module.exports = restful.model('survey_nps', nps)
const restful = require('node-restful')
const mongoose = restful.mongoose

const surveyNpsScores = new mongoose.Schema({
    client: {
        _id: mongoose.Schema.Types.ObjectId,
        reference: Number,
        name: String
    },
    user: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String
    },
    survey:  mongoose.Schema.Types.ObjectId,
    answers: [Object],
    answered_at: { type: Date, default: new Date() }
})

module.exports = restful.model('survey_nps_scores', surveyNpsScores)
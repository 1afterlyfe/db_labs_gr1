const express = require('express');
const app = express();

app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const questionRoutes = require('./routes/questionRoutes');
const surveyLinkRoutes = require('./routes/surveyLinkRoutes');
const responseRoutes = require('./routes/responseRoutes');
const answerRoutes = require('./routes/answerRoutes');

app.use('/api/users', userRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/surveylinks', surveyLinkRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/answers', answerRoutes);

app.get('/', (req, res) => {
    res.send('RESTful API для опитувань працює!');
});

module.exports = app;

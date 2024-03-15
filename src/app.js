const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const swaggerDocument = YAML.load(path.join(__dirname, './doc/swagger.yaml'));
const questionsData = require('./json/questions');
const coachQuestionsData = require('./json/coachQuestions');

const app = express();
app.use(cors());
app.use(express.json());

require('dotenv').config();

// Configure Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//questions
app.get('/questions', (req, res) => {
    try {
        res.status(200).json(questionsData);
    } catch (error) {
        console.error("Failed to retrieve questions data:", error);
        res.status(500).send({ message: "Failed to retrieve questions data." });
    }
});


app.get('/coach-questions', (req, res) => {
    try {
        res.status(200).json(coachQuestionsData);
    } catch (error) {
        console.error("Failed to retrieve coach questions data:", error);
        res.status(500).send({ message: "Failed to retrieve coach questions data." });
    }
});


const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('server is running on port', server.address().port);
});
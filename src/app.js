const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const OpenAI = require("openai")

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

// Configure OpenAI
const openai = new OpenAI();

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


app.get('/check', (req, res) => {
    try {
        res.status(200).json("yey");
    } catch (error) {
        console.error("Failed to retrieve coach questions data:", error);
        res.status(500).send({ message: "Failed to retrieve coach questions data." });
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


function createGPTPrompt(answers) {
    let prompt = `Create a personalized meal plan for an athlete with the following details:\n`;
    for (const [key, value] of Object.entries(answers)) {
        prompt += `- ${key}: ${value}\n`;
    }
    prompt += `Provide nutritional advice and meal suggestions based on these details.`;
    return prompt;
}


// Endpoint to generate personalized meal plan
app.post('/generate-meal-plan', async (req, res) => {
    try {
        const userAnswers = req.body;
        const prompt = createGPTPrompt(userAnswers);

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "gpt-3.5-turbo",
        });

        res.status(200).json({ prompt, mealPlan: completion.choices[0].message.content });
    } catch (error) {
        console.error("Failed to generate meal plan:", error);
        res.status(500).send({ message: "Failed to generate meal plan." });
    }
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('server is running on port', server.address().port);
});
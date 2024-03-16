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

//user
//#region  USER
app.post('/save-user', async (req, res) => {
    try {
        const { firstName, lastName, email, password, userRoleId, userData } = req.body;

        // Initial input validation for null values
        if (!firstName || !lastName || !email || !password || !userRoleId || !userData) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Insert into Users table
        const { data: userArray, error: userError } = await supabase
            .from('Users')
            .insert([
                {
                    "FirstName": firstName,
                    "LastName": lastName,
                    "Email": email,
                    password,
                    "userRoleId": userRoleId
                }
            ]).select('*');

        if (userError) throw new Error(userError.message);
        if (!userArray || userArray.length === 0) throw new Error('User insertion failed.');

        const userId = userArray[0].id;

        const userDataModel = {
            "userId": userId,
            ...userData
        };

        // Insert into UserData table
        const { data: userInfoArray, error: userDataError } = await supabase
            .from('UserData')
            .insert([userDataModel]).select('*');

        if (userDataError) throw new Error(userDataError.message);
        if (!userInfoArray || userInfoArray.length === 0) throw new Error('UserData insertion failed.');

        // Constructing the response data with null checks
        const responseData = {
            user: userArray ? userArray[0] : {},
            userInfo: userInfoArray ? userInfoArray[0] : {}
        };

        res.status(200).json({
            message: "User and related data saved successfully.",
            data: responseData
        });
    } catch (error) {
        console.error("Failed to save user data:", error);
        res.status(500).json({ message: "Failed to save user data.", error: error.message });
    }
});


//#endregion

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
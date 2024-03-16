const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
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
app.use(bodyParser.json({limit: '50mb'}));
require('dotenv').config();

// Configure Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure OpenAI
const openai = new OpenAI({apiKey:process.env.OPENAI_API_KEY});

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

//userRoles
//#region USER ROLES
app.get('/getUserRoles', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('UserRoles')
            .select('*');

        if (error) throw error;

        if (data) {
            res.json(data);
        } else {
            res.status(404).send('No user roles found');
        }
    } catch (err) {
        console.error('Error fetching user roles:', err.message);
        res.status(500).send('Internal Server Error');
    }
});
//#endregion

//user
//#region  USER
app.post('/save-user', async (req, res) => {
    try {
        const { firstName, lastName, email, password, userRoleId, userData,image } = req.body;

        // Initial input validation for null values
        if (!firstName || !lastName || !email || !password || !userRoleId || !userData) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        if(image){
            const fileName = `images/${Date.now()}.png`;
            let imageUrl="";
            // Convert base64 to buffer as Supabase storage expects a Blob/File/Buffer
            const imageBuffer = Buffer.from(image, 'base64')
            const { data, error } = await supabase
            .storage
            .from('imageBucket')
            .upload(fileName, imageBuffer, {
                contentType: 'image/png', 
                upsert: false 
            });

            if (error) {
                throw error;
            }

            // Optionally, generate a public URL for the uploaded image
            const { publicURL, error: urlError } = supabase
                .storage
                .from('imageBucket')
                .getPublicUrl(fileName);

            if (urlError) {
                throw urlError;
            }
            if(publicURL) imageUrl=publicURL;
        }

        // Insert into Users table
        const { data: userArray, error: userError } = await supabase
            .from('Users')
            .insert([
                {
                    firstName,
                    lastName,
                    email,
                    password,
                    userRoleId
                }
            ]).select('*');

        if (userError) throw new Error(userError.message);
        if (!userArray || userArray.length === 0) throw new Error('User insertion failed.');

        const userId = userArray[0].id;

        const userDataModel = {
            "userId": userId,
            ...userData,
            "imagePath": imageUrl
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

app.get('/get-user/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Fetch user from the Users table
        const { data: user, error: userError } = await supabase
            .from('Users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) throw new Error(userError.message);
        if (!user) throw new Error('User not found.');

        // Fetch user additional data from the UserData table
        const { data: userData, error: userDataError } = await supabase
            .from('UserData')
            .select('*')
            .eq('userId', userId)
            .single();

        if (userDataError) throw new Error(userDataError.message);
        // It's possible for a user not to have additional data, so userData might be null

        // Combine user and userData into a single response object
        const responseModel = {
            user,
            userData: userData || {} // If userData is null, default to an empty object
        };

        res.status(200).json(responseModel);
    } catch (error) {
        console.error("Failed to retrieve user info:", error);
        res.status(500).json({ message: "Failed to retrieve user info", error: error.message });
    }
});

app.get('/get-all-users', async (req, res) => {
    try {
        // Fetch all users from the Users table
        const { data: users, error } = await supabase
            .from('Users')
            .select('*');

        if (error) {
            throw new Error(error.message);
        }

        res.status(200).json(users);
    } catch (error) {
        console.error("Failed to retrieve all users:", error);
        res.status(500).json({ message: "Failed to retrieve all users", error: error.message });
    }
});

app.get('/get-image-path/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const { data, error } = await supabase
            .from('user')
            .select('imagePath')
            .eq('id', userId)
            .single(); 

        if (error) {
            throw error;
        }

        if (!data) {
            return res.status(404).send('User not found or no image path available');
        }
        const imagePath = data.imagePath;
        res.status(200).json({
            message: 'Image path fetched successfully',
            imagePath: imagePath
        });
    } catch (err) {
        console.error('Error fetching image path:', err.message);
        res.status(500).send(err.message);
    }
});

//#endregion

//#region OPENAI

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
//#endregion




const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('server is running on port', server.address().port);
});
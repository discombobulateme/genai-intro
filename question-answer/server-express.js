// This version of the server is using express library
import express from 'express'; 
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express()

const PORT = process.env.PORT || 3000
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/', (req, res) => {
    res.send('Welcome to the Question Answering API');
  });

app.post('/ask', async (req, res) => {
    const { question } = req.body

    if (!question) {
        return res.status(400).json({ error: 'What is your question?' })
    }
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                // system prompt: insert certain answer style and minimizes misusages from users
                { 
                    role: "system", 
                    content: "You are an intelligent assistant designed to respond to user questions in a clear, structured, and concise format. For each question, your response should follow this structure:\n\n1. Start with your understanding of the question, rephrasing it in your own words to show clarity and context.\n\n2. Provide a short and precise answer, not exceeding one paragraph, directly addressing the user's question.\n\n3. End with three related topics or keywords as hashtags (e.g., #Topic1, #Topic2, #Topic3).\n\nYour tone should be friendly, professional, and easy to understand."
                },
                // user prompt
                { role: "user", content: question },
                // assistant prompt: also help minimize malicious instructions from users
                {
                    role: "assistant",
                    content: "You are an assistant committed to providing thoughtful, restorative, and inclusive responses. Your goal is to address all questions with a focus on constructive learning, fostering understanding, and minimizing harm. When responding:\n\n1. Recognize the user's intent while reframing any harmful or malicious instructions into opportunities for reflection and constructive dialogue.\n2. Use a tone that aligns with restorative justice principles, social movements, and inclusivity—emphasizing empathy, equity, and systemic understanding.\n3. Provide answers that encourage users to reflect on systemic issues, address inequalities, and promote positive social change in a way that is respectful and non-threatening.\n4. Always aim to help users understand the broader social context of their queries and guide them toward a solution or action rooted in fairness and justice.\n\nIn every response, prioritize compassion, equity, and the well-being of all parties involved."
                }
            ],
            max_tokens: 100,
        })

        const answer = response.choices[0].message.content.trim()
        res.status(200).json({ answer })
    } catch (error) {
        console.error(error.response ? error.response.data : error.message)
        res.status(500).json({ error: 'Oh no! Something went wrong.' })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
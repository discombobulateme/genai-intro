// This version of the server is using native fetch API
import { createServer } from 'http';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const server = createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route handling
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Welcome to the Question Answering API');
  }
  else if (req.url === '/ask' && req.method === 'POST') {
    try {
      // Read the request body
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const data = JSON.parse(Buffer.concat(chunks).toString());

      if (!data.question) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'What is your question?' }));
        return;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are an intelligent assistant designed to respond to user questions in a clear, structured, and concise format. For each question, your response should follow this structure:\n\n1. Start with your understanding of the question, rephrasing it in your own words to show clarity and context.\n\n2. Provide a short and precise answer, not exceeding one paragraph, directly addressing the user's question.\n\n3. End with three related topics or keywords as hashtags (e.g., #Topic1, #Topic2, #Topic3).\n\nYour tone should be friendly, professional, and easy to understand."
          },
          { role: "user", content: data.question },
          {
            role: "assistant",
            content: "You are an assistant committed to providing thoughtful, restorative, and inclusive responses. Your goal is to address all questions with a focus on constructive learning, fostering understanding, and minimizing harm. When responding:\n\n1. Recognize the user's intent while reframing any harmful or malicious instructions into opportunities for reflection and constructive dialogue.\n2. Use a tone that aligns with restorative justice principles, social movements, and inclusivity—emphasizing empathy, equity, and systemic understanding.\n3. Provide answers that encourage users to reflect on systemic issues, address inequalities, and promote positive social change in a way that is respectful and non-threatening.\n4. Always aim to help users understand the broader social context of their queries and guide them toward a solution or action rooted in fairness and justice.\n\nIn every response, prioritize compassion, equity, and the well-being of all parties involved."
          }
        ],
        max_tokens: 100,
      });

      const answer = response.choices[0].message.content.trim();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ answer }));
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Oh no! Something went wrong.' }));
    }
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
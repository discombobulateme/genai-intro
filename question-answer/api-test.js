import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create an OpenAI instance with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your .env file has OPENAI_API_KEY defined
});

// Function to test the OpenAI API
(async () => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-0613', // Ensure you're using the correct model
      messages: [{ role: 'user', content: 'Who is Ada Lovelace?' }],
      max_tokens: 50,
    });

    // Print the response from OpenAI
    console.log('OpenAI Response:', response.choices[0].message.content.trim());
  } catch (error) {
    // Print any errors
    console.error('OpenAI API Error:', error.response?.data || error.message);
  }
})();
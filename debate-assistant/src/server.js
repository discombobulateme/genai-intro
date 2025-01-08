import express from 'express';
import dotenv from 'dotenv';
import { upload } from './uploadHandler';
import OpenAI from 'openai';
import fs from 'fs';

dotenv.config();

const app = express();

// Use Express's built-in body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const openai = new OpenAI(
    {
        apiKey: process.env.OPENAI_API_KEY,
    }
);

let uploadedFileId: string | null = null;

// Upload PDF endpoint
app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const filePath = req.file?.path;
        if (!filePath) return res.status(400).send('File not found.');

        const response = await openai.files.create({
            file: fs.createReadStream(filePath),
            purpose: 'fine-tune'
        });

        uploadedFileId = response.id;
        res.send(`
            <div>
                <p>File uploaded successfully. File ID: ${uploadedFileId}</p>
                <button hx-get="/question-form">Ask a Question</button>
            </div>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading file.');
    }
});

// Serve question form
app.get('/question-form', (req: Request, res: Response) => {
    if (!uploadedFileId) {
        return res.send('<p>No file uploaded. Please upload a file first.</p>');
    }

    res.send(`
        <form hx-post="/ask" hx-target="#response">
            <label for="question">Ask a question:</label>
            <input type="text" id="question" name="question" required>
            <button type="submit">Submit</button>
        </form>
        <div id="response"></div>
    `);
});

// Process question endpoint
app.post('/ask', async (req: Request, res: Response) => {
    const question = req.body.question;

    if (!uploadedFileId) {
        return res.send('<p>No file uploaded. Please upload a file first.</p>');
    }

    try {
        const response = await openai.completions.create({
            model: 'gpt-4',
            prompt: `Answer this question based on the file content: "${question}"`,
            max_tokens: 300,
            temperature: 0.7,
        });

        res.send(`<p>Answer: ${response.choices[0].text.trim()}</p>`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing question.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
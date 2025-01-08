import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let uploadedFileId: string | null = null;

/**
 * Stores the file ID of the uploaded PDF.
 * @param fileId - The file ID returned by OpenAI's file upload API.
 */
export const setUploadedFileId = (fileId: string) => {
    uploadedFileId = fileId;
};

/**
 * Handles the question processing.
 * Retrieves answers from OpenAI based on the uploaded file content.
 */
export const askQuestionHandler = async (req: Request, res: Response) => {
    try {
        const { question } = req.body;

        if (!uploadedFileId) {
            return res.status(400).send('No file uploaded. Please upload a file first.');
        }

        if (!question || question.trim() === '') {
            return res.status(400).send('No question provided.');
        }

        // Use OpenAI API to query based on the uploaded file
        const response = await openai.completions.create({
            model: 'gpt-4',
            prompt: `Answer the following question based on the content of the file uploaded: "${question}"`,
            max_tokens: 300,
            temperature: 0.7,
        });

        res.status(200).send({
            answer: response.choices[0].text.trim(),
        });
    } catch (error) {
        console.error('Error querying OpenAI:', error);
        res.status(500).send('Error processing the question.');
    }
};
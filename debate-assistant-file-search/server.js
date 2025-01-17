import cors from 'cors';
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import OpenAI from 'openai'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicPath = path.join(__dirname, 'public')

dotenv.config()
const app = express()

// middleware
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(publicPath))

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

let chats = [];

let assistantId = null
let pollingInterval
let threadId = null
let vectorStoreId = null
let currentUploadedFilePath = null


const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath); // Ensure the 'uploads' directory exists
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + Date.now() + ext)
  },
})

const upload = multer({ 
  storage: storage 
}).fields([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 },
  { name: 'file3', maxCount: 1 }
]);

async function createAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: 'File-based Assistant',
    instructions: 'You are an assistant that answers questions based on the uploaded PDF file.',
    model: 'gpt-4o-mini',
    tools: [{ type: 'file_search' }],
  })
  assistantId = assistant.id
  console.log(`Assistant created with ID: ${assistantId}`)
}

async function uploadPDFToVectorStore(filePath) {
  try {
    const fileData = await openai.files.create({
      file: fs.createReadStream(filePath), 
      purpose: 'assistants',
    });

    console.log(`File uploaded with ID: ${fileData.id}`);

    let vectorStore = await openai.beta.vectorStores.create({
      name: 'Document Vector Store',
    });

    await openai.beta.vectorStores.files.createAndPoll(vectorStore.id, {
      file_id: fileData.id,
    });

    console.log(`Vector store created with ID: ${vectorStore.id}`);
    vectorStoreId = vectorStore.id;

    await openai.beta.assistants.update(assistantId, {
      tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
    });

    console.log(`Assistant updated with Vector Store ID: ${vectorStoreId}`);
    return vectorStoreId;
  } catch (error) {
    console.error('Error uploading file or creating vector store:', error.message);
    throw error;
  }
}

async function createThread() {
  const thread = await openai.beta.threads.create()
  console.log(thread)
  threadId = thread.id
  return thread
}

async function addQuestion(threadId, question) {
  console.log('Adding a new message to thread: ' + threadId);

  if (!question || typeof question !== 'string') {
    throw new Error("Don't you want to ask me something?");
  }

  const response = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: question,
  });

  return response;
}

async function runAssistant(threadId) {
  console.log('Running assistant for thread: ' + threadId)
  const response = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  })
  console.log(response)
  return response
}

async function checkingStatus(res, threadId, runId) {
  try {
    const runObject = await openai.beta.threads.runs.retrieve(threadId, runId);

    const status = runObject.status;
    console.log(runObject);
    console.log('Current status: ' + status);

    if (status === 'completed') {
      clearInterval(pollingInterval);

      const answersList = await openai.beta.threads.messages.list(threadId);
      let responseText = '';

      for (const message of answersList.data) {
        if (message.role === 'assistant') {
          let cleanAnswer = '';
          let antagonistQuestion = '';

          // Extract and clean the assistant's answer
          message.content.forEach((contentItem) => {
            if (contentItem.type === 'text') {
              cleanAnswer = contentItem.text.value
                .replace(/\【[^】]+】/g, '') // Remove any inline citations
                .split('\n') // Split into paragraphs
                .map((para) => para.trim()) // Trim each paragraph
                .filter((para) => para.length > 0) // Remove empty paragraphs
                .join(' '); // Combine paragraphs into one
            }
          });

          // Generate an antagonist question based on the clean answer
          if (cleanAnswer) {
            antagonistQuestion = `Considering the previous perspective, what if the contrary view, provides a more compelling case?`;
          }

          // Construct the response with one paragraph and a question
          responseText = `<p>${cleanAnswer}</p><p>${antagonistQuestion}</p>`;
          break;
        }
      }

      if (responseText) {
        res.send(responseText);
      } else {
        res.send('<p>Oh, that\'s embarrassing. I don\'t know the answer to that.</p>');
      }
    }
  } catch (error) {
    console.error('Error checking status or retrieving messages:', error.message);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
}

app.post('/upload', upload, async (req, res) => {
  const files = req.files;
  
  if (!files || Object.keys(files).length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }
  
  const fileKeys = ['file1', 'file2', 'file3'];

  // Check for valid file types and process files
  for (const key of fileKeys) {
    if (files[key]) {
      const uploadedFile = files[key][0];
      if (uploadedFile.mimetype !== 'application/pdf') {
        fs.unlinkSync(uploadedFile.path); // Cleanup invalid file
        return res.status(400).json({ error: 'Invalid file type. Only PDF files are allowed.' });
      }
    }
  }

  try {
    // Process all uploaded files
    for (const key of fileKeys) {
      if (files[key]) {
        await uploadPDFToVectorStore(files[key][0].path);
      }
    }
    res.json({ message: 'Files uploaded and processed successfully.' });
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ error: 'Failed to process files.' });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      console.log('Missing question parameter');
      return res.status(400).json({ error: 'Missing question parameter' });
    }

    if (!threadId) {
      console.log('Creating a new thread...');
      const thread = await createThread();
      threadId = thread.id;
      console.log(`New thread created with ID: ${threadId}`);
    }

    // Pass the question to the assistant
    await addQuestion(threadId, question);

    // Run the assistant
    const run = await runAssistant(threadId);
    const runId = run.id;

    // Poll for the assistant's response
    pollingInterval = setInterval(() => {
      checkingStatus(res, threadId, runId);
    }, 5000);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/saveChat', (req, res) => {
  const { question, answer, timestamp } = req.body;
  chats.push({ question, answer, timestamp }); // Save structured chat to in-memory list
  res.status(200).send('Chat saved');
});

app.post('/excludeChat', (req, res) => {
  const { chat } = req.body;
  chats = chats.filter(c => c !== chat); // Exclude chat from list
  res.status(200).send('Chat excluded');
});

app.post('/generateEssay', async (req, res) => {
  try {
    if (chats.length === 0) {
      return res.status(400).json({ error: 'No saved conversations to generate essay from.' });
    }

    // Format the saved conversations into a structured prompt
    const formattedDiscussions = chats.map(chat => {
      // Strip HTML tags from answer
      const cleanAnswer = chat.answer.replace(/<[^>]*>/g, '');
      return `Question: ${chat.question}\nAnswer: ${cleanAnswer}`;
    }).join('\n\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Update to correct model name
      messages: [
        { 
          role: 'system', 
          content: 'You are an academic writer tasked with synthesizing multiple discussions into a coherent essay. Focus on analyzing the key points and creating logical connections between different ideas.'
        },
        { 
          role: 'user', 
          content: `Based on the following discussions, write a well-structured academic essay that synthesizes the main points and develops a cohesive argument:\n\n${formattedDiscussions}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const essay = response.choices[0].message.content.trim();
    res.status(200).json({ 
      essay: essay,
      sourcesCount: chats.length
    });
  } catch (err) {
    console.error('Error generating essay:', err);
    res.status(500).json({ error: 'Failed to generate essay: ' + err.message });
  }
});

// Update the cleanup endpoint
app.post('/cleanup', (req, res) => {
  try {
    // Clear the uploads directory
    const uploadPath = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadPath)) {
      const files = fs.readdirSync(uploadPath);
      files.forEach(file => {
        const filePath = path.join(uploadPath, file);
        fs.unlinkSync(filePath);
      });
    }

    // Reset all the state variables
    assistantId = null;
    threadId = null;
    vectorStoreId = null;
    currentUploadedFilePath = null;
    chats = [];

    // Clear any running intervals
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    res.json({ message: 'Cleanup successful' });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup files: ' + error.message });
  }
});

// Add this endpoint for PDF generation
app.post('/generatePdf', (req, res) => {
    const { essay, sourcesCount } = req.body;
    
    // Create a PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=generated-essay.pdf');
    
    // Pipe the PDF document to the response
    doc.pipe(res);
    
    // Add content to the PDF
    doc.fontSize(20).text('Generated Essay', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(essay);
    doc.moveDown();
    doc.fontSize(10).text(`Based on ${sourcesCount} saved conversations`, { align: 'right' });
    
    // Finalize the PDF
    doc.end();
});

const PORT = process.env.PORT || 3000
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await createAssistant()
})

//TODO: antagonist question is not reasoning, its a fixed phrase
// TODO: it is not keeping answers to its content
// TODO: save questions and answers to a database
// TODO: add a chat history
// TODO: add saves chat to UI
// TODO: delete uploaded files


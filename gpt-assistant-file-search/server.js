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

// Also add preflight handling
app.options('*', cors(corsOptions)); // enable pre-flight for all routes

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

let assistantId = null
let vectorStoreId = null
let threadId = null
let pollingInterval


const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + Date.now() + ext)
  },
})

const upload = multer({ storage: storage })

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
    })

    console.log(`File uploaded with ID: ${fileData.id}`)

    let vectorStore = await openai.beta.vectorStores.create({
      name: 'Document Vector Store',
    })

    await openai.beta.vectorStores.files.createAndPoll(vectorStore.id, {
      file_id: fileData.id,
    })

    console.log(`Vector store created with ID: ${vectorStore.id}`)

    vectorStoreId = vectorStore.id

    await openai.beta.assistants.update(assistantId, {
      tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
    })
    console.log(`Assistant updated with Vector Store ID: ${vectorStoreId}`)
    return vectorStoreId
  } catch (error) {
    console.error('Error uploading file or creating vector store:', error.message)
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
    const runObject = await openai.beta.threads.runs.retrieve(threadId, runId)

    const status = runObject.status
    console.log(runObject)
    console.log('Current status: ' + status)

    if (status == 'completed') {
      clearInterval(pollingInterval)

      const answersList = await openai.beta.threads.messages.list(threadId)
      let answers = []

      answersList.data.forEach(message => {
        console.log('message.content', message.content)

        if (message.role === 'assistant') {
          message.content.forEach(contentItem => {
            if (contentItem.type === 'text') {
              let cleanText = contentItem.text.value.replace(/\【[^】]+】/g, '') 
              answers.push(cleanText.trim())
            }
          })
        }
      })
      console.log('answers  => ', answers)
      const lastAnswer = answers.length > 0 ? answers[0] : 'Oh thats embarassing, I dont know the answer to that.'
      res.json({ answers: [lastAnswer] })
    }
  } catch (error) {
    console.error('Error checking status or retrieving messages:', error.message)
    res.status(500).json({ error: 'Failed to retrieve messages.' })
  }
}

app.post('/ask', async (req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Raw body:', req.rawBody);
  
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

app.post('/upload', upload.single('file'), async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  const file = req.file;

  // Check if a file is provided
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Validate file type
  if (file.mimetype !== 'application/pdf') {
    // Remove the file if it was saved but is invalid
    fs.unlinkSync(file.path);
    return res.status(400).json({ error: 'Invalid file type. Only PDF files are allowed.' });
  }

  const filePath = path.join(__dirname, file.path);
  console.log(`File uploaded to: ${filePath}`);

  try {
    await uploadPDFToVectorStore(filePath);
    // Remove the file after processing
    fs.unlinkSync(filePath);

    res.json({ message: 'File uploaded and processed successfully.' });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file.' });
  }
});

const PORT = process.env.PORT || 3000
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await createAssistant()
})
# Debate Preparation Assistant

The Debate Preparation Assistant is a local application that leverages OpenAI’s API to help users prepare for debates by querying content from uploaded PDF files. Users can upload a PDF, and the assistant will answer questions or “debate” based on the PDF’s content.

The assistant processes the PDF, stores it in a vector store, and allows the user to ask questions related to the PDF content. Vector search is used to retrieve relevant content to answer user queries. It is setup as an opaque method, offered by OpenAI tool [Assistant File Search](https://platform.openai.com/docs/assistants/tools/file-search).

## Assistant File Search - beta

"File Search augments the Assistant with knowledge from outside its model, such as proprietary product information or documents provided by your users. OpenAI automatically parses and chunks your documents, creates and stores the embeddings, and use both vector and keyword search to retrieve relevant content to answer user queries."


## Features
- Upload a PDF file to analyze its content.
- Store the file in OpenAI’s File Search for context-aware querying.
- Ask questions related to the content of the uploaded file.
- Dynamic and lightweight interface using HTMX for seamless interaction.

## Tech stack
- Node.js for server
- OpenAI API for AI interactions
- HTMX for frontend
- Express for server
- Multer for file uploads
- Typescript

## Endpoints

1. /upload
	•	Method: POST
	•	Description: Uploads a PDF file, stores it in OpenAI File Search, and returns a file ID.

2. /question-form
	•	Method: GET
	•	Description: Returns an HTML form for submitting a question.

3. /ask
	•	Method: POST
	•	Description: Accepts a question and returns an answer based on the uploaded file.

## Project structure

```
debate-assistant/
├── src/
│   ├── server.ts          # Main server file
│   ├── uploadHandler.ts   # Handles file uploads
│   ├── queryHandler.ts    # Processes questions and interacts with OpenAI
├── public/
│   ├── index.html         
│   ├── styles.css         
├── uploads/               
```

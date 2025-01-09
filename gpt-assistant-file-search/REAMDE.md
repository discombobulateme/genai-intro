# GPT Assistant File Search

This project is a local application leveraging OpenAI's API to allow users to:
1. Upload a PDF file for content analysis using the browser
2. Ask questions based on the uploaded file's content

The app processes the file, stores it in a vector store, and utilizes OpenAI's GPT model to answer questions or assist in exploring the file's content.

---

## Features
- **File Upload**: Users can upload PDF files for processing.
- **Question Answering**: Users can ask questions about the uploaded file, and the assistant provides context-aware responses.
- **HTMX Integration**: A lightweight frontend framework ensures smooth, dynamic updates without page reloads.

---

## Application Flow

1. **File Upload**:
   - User selects a PDF file.
   - The file is sent to the backend via a `POST` request to `/upload`.
   - Backend uploads the file to OpenAI, creates a vector store, and links it to the assistant.

2. **Ask a Question**:
   - User types a question in the text box.
   - The question is sent via a `POST` request to `/ask`.
   - Backend processes the question, runs the assistant, and returns the response.

3. **Receive Response**:
   - The assistant's response is dynamically displayed on the page.

---

## Project Structure
````
monorepo-root/
├── package.json
├── node_modules/
└── gpt-assistant-file-search/
    ├── server.js
    └── public/
        └── index.html
```

---

## How to Run the Project

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Server**:
   ```bash
   node gpt-assistant-file-search/server.js
   ```

3. **Open the Browser**:
   Navigate to `http://localhost:3000` in your web browser.

4. **Upload a PDF**:
   Select a PDF file from your local machine and click "Upload" to start processing.

5. **Ask a Question**:
   Type your question in the input box and click "Submit" to get a response.
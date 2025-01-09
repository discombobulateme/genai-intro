# GPT Assistant File Search

This project is a local application leveraging OpenAI's API to allow users to:
1. **Upload a PDF file** for content analysis directly from the browser.
2. **Ask questions** based on the uploaded file's content.
3. **Explore file contents** interactively with responses provided by OpenAI's GPT model.

The app processes the uploaded file, stores it in a vector store, and uses OpenAI's GPT model to answer questions or assist in exploring the file's content.

---

## Features
- **File Upload**: Supports uploading and processing PDF files.
- **Contextual Question Answering**: Users can ask questions directly related to the content of the uploaded file.
- **Session Management**: Includes a "cleanup" feature to reset the session, clear uploaded files, and restore the app to its initial state.
- **HTMX Integration**: A lightweight frontend framework ensures smooth, dynamic updates without full page reloads.
- **Error Handling**: User-friendly messages for invalid file uploads, server errors, and unsupported questions.

---

## Application Flow

### **1. File Upload**
   - The user selects a PDF file using the upload button.
   - The file is sent to the backend (`/upload`) via a `POST` request.
   - The backend:
     1. Uploads the file to OpenAI's file storage.
     2. Creates a vector store for document embeddings.
     3. Links the vector store to the assistant for future queries.
   - On success, the user is notified, and the interface allows further interaction.

### **2. Ask a Question**
   - The user types a question related to the uploaded PDF file in the input box.
   - A `POST` request is sent to the `/ask` endpoint.
   - The backend processes the question and queries OpenAI's GPT model.
   - The assistant provides a response based on the document's content.

### **3. Receive Response**
   - The assistant's response is dynamically displayed in the browser without a page reload.

### **4. Cleanup Session**
   - The user clicks "End Session" to clear the uploaded file and reset the app.
   - The server deletes the file, and the interface is restored to its initial state.

---

## Project Structure
````
monorepo-root/
├── package.json
├── node_modules/
└── gpt-assistant-file-search/
├── server.js        # Backend server logic
├── public/          # Static assets served by the app
│   ├── index.html   # Main HTML file with HTMX integration
│   ├── styles.css   # CSS for styling the app
│   └── scripts.js   # Additional client-side JavaScript (if any)
└── uploads/         # Temporary storage for uploaded files

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
   You can ask as many questions as you want, if should only answer questions related to the uploaded file.

6. **Cleanup Session**:
   Click "End Session" to clear the uploaded file and restore the app to its initial state.

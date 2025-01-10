# Gen AI Learning Monorepo

Welcome to the **Gen AI Learning Monorepo**, a collection of applications designed to explore and experiment with Generative AI concepts and functionalities. This repository is structured as a **monorepo** to share common packages and utilities across multiple projects.

This project was inspired by WomenTechMakers Berlin [GenerativeAI Crash course](https://github.com/WTMBerlin/generative-ai-course) by [Armagan Amcalar](https://github.com/dashersw).

## **Repository Link**
[GitHub Repository: discombobulateme/genai-intro](https://github.com/discombobulateme/genai-intro)

---

## **Key Features**
- **Monorepo Architecture**: A centralized repository managing multiple Gen AI applications with shared dependencies and utilities.
- **Generative AI Focus**: Each application demonstrates specific use cases of Generative AI, leveraging OpenAI's API.
- **Secure Environment Management**: Sensitive data like API keys are securely managed using `.env` files with the `dotenv` package.
- **Modern Backend**: Servers are built with Node.js to ensure scalability and performance.
- **Lightweight Frontend**: Frontends use HTMX for dynamic interactions without relying on heavy JavaScript frameworks.

---

## **Technologies Used**
- **Backend**: Node.js, Express.js
- **Frontend**: HTMX, HTML5, CSS
- **Environment Variables**: dotenv for secure API key management
- **AI Services**: OpenAI API

---

## **Applications**
1. **Question Answering API**:
   - A simple API that answers questions based on a predefined roles to avoid misuse.

2. **GPT Assistant File Search**:
   - A web app where users can upload PDF files and ask questions about their content.
   - Uses OpenAI's GPT model for contextual question answering.
   - Combines file processing with vector-based search for accurate results.

3. **Debate Assistant**:
   - Built on top of GPT Assistant File Search, analise more then one file and answer questions based on the content of the files.
   - Instead of answering questions, the assistant returns questions with an antagonist take stimulating a debate

---

## **Setup and Usage**

### **1. Clone the Repository**
```bash
git clone https://github.com/discombobulateme/genai-intro.git
cd genai-intro
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Setup Environment Variables**

Create a `.env` file in the root of the repository and add your OpenAI API key:
```bash
OPENAI_API_KEY=your_api_key_here
```

### **4. Run the chosen application**
```bash
node <chosen-app>/server.js
```

### **5. Access the application**
Open your browser and navigate to `http://localhost:3000` to see the application in action.

## License

This project is licensed under the Apache License.
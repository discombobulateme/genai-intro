# Question Answering API with OpenAI

This project is a Node.js-based application that provides a simple API for users to ask questions and receive thoughtful, concise, and constructive answers powered by OpenAI’s GPT models. The system and assistant roles are carefully designed to ensure meaningful interactions that prioritize learning, inclusivity, and restorative approaches to addressing queries.

## Features
	•	REST API: Simple endpoints for asking questions
	•	OpenAI Integration: Leverages the power of OpenAI’s GPT models to generate accurate responses
	•	Thoughtful Role Configuration: Includes system and assistant roles tailored to foster constructive learning and minimize harm
	•	Customizable: Configure the OpenAI model, tokens, and API key via a .env file
	•	Lightweight: Built using Express for fast and efficient API responses

## Getting Started

### Prerequisites
	•	Node.js (v16 or higher)
	•	npm (comes with Node.js)
	•	OpenAI API Key

### Installation
	1.	Clone the repository:

```git clone https://github.com/your-username/question-answering-api.git```
```cd question-answering-api```

	2.	Install dependencies:

```npm install```

	3.	Create a .env file:
	•	Add your OpenAI API key:

```OPENAI_API_KEY=your_openai_api_key_here```

	4.	Start the server:

```npm start```

	5.	Your server will run at:

http://localhost:3000

## API Usage

1. GET /
	•	Description: Returns a welcome message.
	•	Example Request:

GET http://localhost:3000/

	•	Example Response:

Welcome to the Question Answering API

2. POST /ask
	•	Description: Sends a question to the OpenAI API and returns the answer.
	•	Headers:
	•	Content-Type: application/json
	•	Body:

{
  "question": "Who is Ada Lovelace?"
}

	•	Example Request using REST Client VSCode plugin:

POST http://localhost:3000/ask
Content-Type: application/json

{
  "question": "Who is Ada Lovelace?"
}


	•	Example Response:

{
  "answer": "Ada Lovelace was a mathematician and writer, widely regarded as the first computer programmer."
}

## Project Structure

├── server.js           # Main application file
├── package.json        # Project metadata and dependencies
├── .env                # Environment variables (not committed to version control)
├── request.http        # HTTP file for testing API requests
└── README.md           # Documentation

## Testing the API

Using REST Client
	1.	Install the REST Client Extension in Visual Studio Code.
	2.	Open the request.http file in the project.
	3.	Click the “Send Request” button to test the API.

## Environment Variables

Variable	|Description	|Example Value
OPENAI_API_KEY	|Your OpenAI API key (required)	|sk-xxxxxxxxxxxxxxxxxxxx
PORT	|Port on which the server will run	|3000

## Dependencies
	•	openai: OpenAI Node.js SDK for interacting with GPT models.

### Optional:
	•	dotenv: Loads environment variables from a .env file
	•	Express: Express is a lightweight Node.js framework that simplifies building web servers and APIs by handling routing, middleware, and request/response management, reducing boilerplate compared to Node.js’s native http module.
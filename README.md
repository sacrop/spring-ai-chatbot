# Spring AI Chat Application

A full-stack Spring AI application with a Spring Boot backend and React frontend. The backend connects to an NVIDIA OpenAI-compatible chat API and exposes an HTTP endpoint that returns generated text.

## Project structure

```text
backend/
  src/main/java/com/springai/backend/
    BackendApplication.java
    controller/ChatController.java
  src/main/resources/application.properties
  pom.xml

frontend/
  src/
  public/
  package.json
```

## Technologies

- Java 17
- Spring Boot 4.2
- Spring AI 2.1.0-M1
- NVIDIA OpenAI-compatible API
- React 19
- TypeScript

## Prerequisites

- Java 17 or later
- Node.js and npm
- An NVIDIA API key

## Configuration

Create `backend/.env` with the following values:

```properties
OPEN_AI_API_SECRET=your_nvidia_api_key
BASE_URL=https://integrate.api.nvidia.com/v1
MODEL_NAME=nvidia/nemotron-3.5-bolt-e4b
EMBEDDING_ENABLED=false
```

The backend loads this file through `spring.config.import=optional:file:.env[.properties]`.

Keep `.env` out of source control and never publish API keys in code or commits. If a key has already been committed or shared, revoke and replace it.

## Run the backend

From the repository root:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The backend starts on `http://localhost:8080` by default.

### Chat endpoint

```text
GET /ai/generate
```

Optional query parameter:

- `message`: The prompt sent to the model

Example:

```text
http://localhost:8080/ai/generate?message=Tell%20me%20a%20joke
```

PowerShell example:

```powershell
Invoke-RestMethod "http://localhost:8080/ai/generate?message=Tell%20me%20a%20joke"
```

The response is a JSON object containing the generated text under the `generation` property.

## Run the frontend

From the repository root:

```powershell
cd frontend
npm install
npm start
```

The React development server normally opens at `http://localhost:3000`.

The current frontend is the standard Create React App scaffold and can be extended to call the backend chat endpoint.

## Test

Run backend tests:

```powershell
cd backend
.\mvnw.cmd test
```

Run frontend tests:

```powershell
cd frontend
npm test
```

## API configuration notes

`BASE_URL` should be the NVIDIA API root, not the complete `/chat/completions` URL. Spring AI adds the chat-completion path based on the configured OpenAI-compatible client.

`MODEL_NAME` must be a model available to the NVIDIA API key and account. Change this value when the provider changes model availability.

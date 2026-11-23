# Spring AI Chat Application - React Frontend

A production-ready AI chat interface built with **React 19**, **Tailwind CSS**, and **Server-Sent Events (SSE)**, designed to connect to a **Java Spring Boot backend with Spring AI**.

Styled with a clean, high-contrast **white background and black text** aesthetic, full conversation history management, PDF attachment handling, and Retrieval-Augmented Generation (RAG) support.

---

## Features

- **Clean Aesthetic**: Modern, minimalist monochrome design (`bg-white`, `text-zinc-900`) built with Tailwind CSS.
- **Conversation Sidebar**:
  - **New conversation** button with keyboard shortcut (`Ctrl+N` / `Cmd+N`).
  - Categorized chat history (**Today**, **Yesterday**, **Previous 7 Days**, **Older**).
  - Search/filter conversations in real time.
  - Inline title editing and conversation deletion.
  - Attached PDF document count badge.
  - Authenticated user profile and quick account switcher.
  - Live Spring Boot backend health indicator (`Online (8080)` vs `Simulated (Demo)`).
- **Chat Area**:
  - User and Assistant messages with clean avatars.
  - **Rich Markdown Formatting**: Code blocks with syntax tags and 1-click **Copy Code** button, bullet/numbered lists, bold, italics, blockquotes, and tables.
  - **RAG Grounded Badges**: Highlights when a response used indexed PDF document context.
  - Message timestamp and 1-click text copy.
- **Message Composer**:
  - Auto-resizing textarea (grows dynamically up to 200px max height).
  - Keyboard shortcuts (`Enter` to send, `Shift+Enter` for multi-line).
  - **PDF Attachment**:
    - Paperclip file picker button restricted to `.pdf` files.
    - Drag-and-drop PDF onto the composer area.
    - Attached PDF preview chips with file size, RAG badge, and remove button.
    - Upload progress indicator.
  - **Stop Generation**: 1-click button to abort active SSE streaming at any time.
- **Comprehensive State Management**:
  - **Loading states**: Skeleton loaders for conversations and chat history.
  - **Streaming state**: Real-time token streaming via SSE with a blinking cursor.
  - **Error state**: User-friendly error banners, retry buttons for failed prompts, and non-blocking toast alerts.
  - **Empty state**: Clean welcoming view with prompt suggestion cards that auto-fill the composer.
- **Seamless Offline / Demo Fallback**:
  - If the Spring Boot backend is offline or starting up, the frontend automatically falls back to an intelligent mock engine that simulates SSE streaming, user-scoped persistence in `localStorage`, and PDF RAG citation.

---

## Project Structure

```text
src/
├── api/
│   ├── client.js               # REST & SSE fetch client with timeout, Auth headers, and stream reader
│   ├── conversationApi.js      # REST CRUD & SSE streaming endpoints for conversations
│   └── documentApi.js          # Multipart PDF upload and document endpoints for RAG
├── components/
│   ├── chat/
│   │   ├── AttachmentPreview.js # PDF file badge & chip preview
│   │   ├── ChatArea.js          # Main chat scroll container, header, and composer host
│   │   ├── ChatMessage.js       # User & Assistant message bubbles with actions
│   │   ├── EmptyState.js        # Welcome screen with prompt suggestion cards
│   │   └── MessageComposer.js   # Input textarea, file upload, stop, and send buttons
│   ├── common/
│   │   ├── Icons.js             # Tailwind-styled SVG icons
│   │   ├── SkeletonLoader.js    # Pulse skeleton loaders for loading states
│   │   └── Toast.js             # Error banners and floating toast alerts
│   └── sidebar/
│       ├── ConversationItem.js  # History item with active highlight, rename & delete
│       ├── ConversationList.js  # Grouped date sections (Today, Yesterday, etc.)
│       ├── Sidebar.js           # Responsive drawer navigation & New Chat button
│       └── UserProfile.js       # Authenticated user pill and user switcher
├── context/
│   ├── AuthContext.js           # Current authenticated user and headers
│   └── ChatContext.js           # Global conversation and active chat state provider
├── hooks/
│   ├── useChat.js               # Messages, SSE streaming, attachments, and retry logic
│   └── useConversations.js      # Conversation list CRUD operations
├── services/
│   └── mockBackend.js           # In-browser fallback engine with simulated SSE & PDF RAG
├── types/
│   └── index.js                 # Shared JSDoc types for Conversation, Message, User, Document
├── utils/
│   ├── formatters.js            # Date grouping, relative times, and file size formatting
│   └── markdown.js              # Lightweight zero-dependency markdown parser & CodeBlock
├── App.js                       # Root application container
├── index.css                    # Tailwind CSS base and minimalist scrollbars
└── index.js                     # React 19 root mounting
```

---

## Spring Boot Backend Integration Reference

The React frontend expects the following REST and SSE endpoints on `http://localhost:8080`:

### 1. Conversation Endpoints (REST)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/conversations?userId={userId}` | List all conversations for the user |
| `POST` | `/api/conversations` | Create a new conversation (`{ userId, title }`) |
| `GET` | `/api/conversations/{id}/messages` | Get all message history for a conversation |
| `DELETE` | `/api/conversations/{id}` | Delete conversation and message history |

### 2. Streaming Chat Endpoint (SSE)

```http
POST /api/conversations/{conversationId}/stream
Content-Type: application/json
Accept: text/event-stream
X-User-Id: user-alex

{
  "message": "Explain Spring AI RAG pipeline",
  "attachments": ["doc-123"]
}
```

#### Spring Boot Controller Example:
```java
package com.springai.backend.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/conversations")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatStreamController {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    public ChatStreamController(ChatClient.Builder builder, VectorStore vectorStore) {
        this.chatClient = builder.build();
        this.vectorStore = vectorStore;
    }

    @PostMapping(value = "/{conversationId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(
            @PathVariable String conversationId,
            @RequestBody ChatRequest request) {

        return chatClient.prompt()
                .user(request.message())
                .advisors(new QuestionAnswerAdvisor(vectorStore, SearchRequest.defaults()))
                .stream()
                .content()
                .map(chunk -> "data: " + chunk + "\n\n");
    }

    public record ChatRequest(String message, java.util.List<String> attachments) {}
}
```

### 3. PDF Upload Endpoint for RAG

```http
POST /api/conversations/{conversationId}/documents
Content-Type: multipart/form-data

file: [binary PDF data]
```

#### Spring Boot PDF Ingestion Example:
```java
@PostMapping("/{conversationId}/documents")
public DocumentResponse uploadPdf(
        @PathVariable String conversationId,
        @RequestParam("file") MultipartFile file) throws IOException {

    // 1. Read PDF
    var pdfReader = new PagePdfDocumentReader(new ByteArrayResource(file.getBytes()));
    var docs = pdfReader.get();

    // 2. Split into semantic chunks
    var textSplitter = new TokenTextSplitter();
    var chunks = textSplitter.apply(docs);

    // 3. Store in VectorStore for RAG
    vectorStore.accept(chunks);

    return new DocumentResponse(UUID.randomUUID().toString(), file.getOriginalFilename(), file.getSize(), "ready");
}
```

---

## Running the Application

### 1. Start Development Server
```bash
npm start
```
The app will open automatically at [http://localhost:3000](http://localhost:3000).

### 2. Run Tests
```bash
npm test -- --watchAll=false
```

### 3. Production Build
```bash
npm run build
```
Creates an optimized production bundle in the `build/` directory with Tailwind CSS styles.

# 🧠 AI Sentiment Intelligence System

A complete full-stack web application for **AI-powered sentiment analysis**, emotion detection, keyword extraction, and intelligent text improvement suggestions — featuring a **chatbot-first** interface.

---

## 🚀 Features

- 🤖 **Chatbot Interface** — Conversational AI explains results naturally
- 📊 **Sentiment Analysis** — Positive / Negative / Neutral with confidence score
- 🎭 **Emotion Detection** — Happy, Sad, Angry, Neutral, Surprise, Fear
- 🔑 **Keyword Extraction** — Top 5–8 key topics
- 💡 **Smart Suggestions** — Rewrite negative text positively
- 📈 **Session Dashboard** — Pie & bar charts (Chart.js) for session data
- 🌐 **Multilingual** — English, Hindi, and Hinglish support
- 🌙 **Dark / Light Mode** toggle
- 📋 **Copy Results** & 📤 **Export JSON** buttons
- 🔄 **Analyze Again** feature

---

## 🏗️ Tech Stack

| Layer    | Technology                |
|----------|---------------------------|
| Frontend | React + Vite, Chart.js    |
| Backend  | Node.js, Express.js, Axios|
| AI API   | Gemini (via backend)      |
| Styling  | Vanilla CSS (design system)|

---

## 📁 Project Structure

```
AI-Sentiment-Intelligence-System/
├── backend/
│   ├── controllers/
│   │   ├── analysisController.js
│   │   └── chatController.js
│   ├── middleware/
│   │   ├── errorMiddleware.js
│   │   └── validationMiddleware.js
│   ├── routes/
│   │   ├── analysisRoutes.js
│   │   └── chatRoutes.js
│   ├── services/
│   │   └── openRouterService.js
│   ├── .env                  ← API key goes here
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx / .css
│   │   │   ├── Dashboard.jsx / .css
│   │   │   ├── Header.jsx / .css
│   │   │   └── ResultCards.jsx / .css
│   │   ├── services/
│   │   │   └── apiService.js
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   └── App.css
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Get a Gemini API Key

1. Sign in to your Google Cloud or Gemini account
2. Go to the API credentials / keys section
3. Create a new API key for Gemini access

### 2. Configure Backend Environment

Create `backend/.env` based on `backend/.env.example` and replace the placeholder:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **Never commit your `.env` file to Git!** It's already in `.gitignore`.

### 3. Install Dependencies

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd AI-Sentiment-Intelligence-System/backend
npm install
```

**Terminal 2 — Frontend:**
```bash
cd AI-Sentiment-Intelligence-System/frontend
npm install
```

### 4. Run the Application

**Terminal 1 — Start Backend:**
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 — Start Frontend:**
```bash
cd frontend
npm run dev
# App opens at http://localhost:3000
```

### 5. Open in Browser

Navigate to **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/health`             | Backend health check           |
| POST   | `/api/analysis/analyze` | Analyze text for sentiment   |
| POST   | `/api/chat/message`   | Send a chat message            |

### Example Request — Analyze Text

```bash
curl -X POST http://localhost:5000/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling great today!", "conversationHistory": []}'
```

### Example Response

```json
{
  "success": true,
  "data": {
    "sentiment": "Positive",
    "confidence": 92,
    "emotions": {
      "happy": 75,
      "sad": 5,
      "angry": 2,
      "neutral": 10,
      "surprise": 5,
      "fear": 3
    },
    "keywords": ["great", "feeling", "today"],
    "suggestion": "You're already expressing yourself positively! Consider adding specific details about what's making you feel great.",
    "explanation": "Your text radiates positivity! The word 'great' strongly signals happiness and well-being.",
    "language": "English",
    "analyzedText": "I am feeling great today!",
    "timestamp": "2026-04-24T17:30:00.000Z"
  }
}
```

---

## 🔐 Security

- API key stored only in backend `.env` — **never sent to frontend**
- CORS configured to allow only the frontend origin
- Rate limiting: 100 requests per 15 minutes per IP
- Helmet.js for security headers
- Input validation and length limits on all endpoints

---

## 🌐 Multilingual Support

The system handles:
- **English** — Standard English text
- **Hindi** — Devanagari script (हिंदी)
- **Hinglish** — Mixed Hindi-English ("Aaj mausam bahut acha hai yaar!")

No manual translation required — the AI interprets automatically.

---

## 🎨 Color System

| Sentiment | Color  | Hex       |
|-----------|--------|-----------|
| Positive  | Green  | `#10b981` |
| Negative  | Red    | `#ef4444` |
| Neutral   | Yellow | `#f59e0b` |

---

## 📝 License

MIT License — Free to use for educational purposes.

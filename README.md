🔗 **Live Demo:** https://ai-summarizer-frontend-beige.vercel.app/
⚙️ **Backend API:** https://ai-summarizer-app.hostless.app/health 
*(Note: Backend is an API. You can check its health status at `/health`.)*
![AI Summarizer Screenshot] <img width="1107" height="690" alt="Screenshot 2026-11-07 230432" src="https://github.com/user-attachments/assets/7eea01e4-1b88-4c9b-a39d-c6ce326a695d" />


# AI Summarizer - Backend API

This is the backend server for the AI Text Summarizer application. It provides a RESTful API that utilizes Google Gemini AI to generate concise summaries from long text inputs.

## 🚀 Features
- **AI Integration:** Powered by Google Gemini API (`gemini-2.0-flash` model).
- **Custom Summaries:** Supports short, medium, and long summary lengths.
- **Security:** Includes rate limiting (max 10 requests/min per IP) and restricted CORS.
- **Input Validation:** Prevents empty requests and limits text length to 10,000 characters to save API costs.
- **Health Check:** Includes a `/health` endpoint for deployment monitoring.

## 🛠️ Tech Stack
- **Node.js** & **Express.js**
- **Google GenAI SDK** (`@google/genai`)
- **Express Rate Limit** (Security)
- **CORS** & **Dotenv**

## 📦 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Checks if the server is running. |
| `POST` | `/api/summarize` | Accepts JSON body `{ text, length }` and returns the AI summary. |

## ⚙️ How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd backend

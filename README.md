# ⚙️ Career Compass – Backend
**IF YOU ARE NEW TO THE PLATFORM THEN DIRECTLY LOGIN VIA GOOGLE YOU'LL GET IT THROUGH ALL THE PROCESS OF SIGNUP**

This is the backend server for the **Career Compass** project.
It provides APIs for AI-powered career recommendations, job search, resume analysis, and integrates with external services like OpenRouter, Firebase, and SERP API.

---

## ⚡ Tech Stack

* **Node.js** – Backend runtime
* **Express.js** – Web framework
* **Firebase Realtime Database** – Data storage
* **OpenRouter API** – AI-powered responses
* **SERP API** – Job & search data
* **Dotenv** – Environment variables

---

## 🛠 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/career-compass-backend.git
cd career-compass-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the backend root and add your credentials:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key  
PORT=5000  

FIREBASE_DB_URL=your_firebase_database_url  

SERP_API_KEY=your_serp_api_key  
```

⚠️ Make sure `.env` is added to `.gitignore` to avoid exposing sensitive keys.

### 4. Run the server

```bash
node server.js
```

Server will run on:

```
http://localhost:5000
```

---

## 📂 Folder Structure

* `server.js` – Main entry point


---

## 🚀 Features

* AI-powered career path suggestions
* Resume parsing & analysis
* Job & internship search via APIs
* Firebase-based user & data management
* Secure environment variable handling

---

## 👨‍💻 Author

* Shubham – Solo Developer (Team Solo Synergy)

---

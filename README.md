# 🎬 WatchWise

**WatchWise** is a full-stack web application designed to help you track, discover, and explore movies and TV shows. Whether you're managing your watchlist, checking out trending content, or asking the built-in AI assistant for recommendations, WatchWise is your ultimate entertainment companion.

---

## ✨ Features

- **Personalized Watchlist**: Add, manage, and track your favorite movies and TV shows.
- **AI Chatbot Assistant**: Ask for smart movie or TV show recommendations in natural language, powered by OpenRouter AI and TMDB context.
- **Trending & Search**: Discover what's hot right now or search across a massive database of content.
- **Rich Content Details**: View detailed information about movies, TV series, individual seasons, and cast.
- **Trailer Integration**: Seamlessly watch trailers directly within the application.
- **User Dashboard**: Keep an eye on your watching statistics and profile data.
- **Secure Authentication**: Robust user signup and login system using JWT and bcrypt.
- **Modern & Responsive UI**: Beautifully crafted with Tailwind CSS and Framer Motion for smooth, glass-morphic animations.
- **Dark/Light Mode**: Includes context-based theme toggling for the best viewing experience at any time of day.

---

## 🛠️ Tech Stack

**Frontend (Client)**
- **Framework**: [React 19](https://react.dev/) powered by [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Icons**: Heroicons, Lucide React, React Icons
- **Data Visualization**: Recharts

**Backend (Server)**
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (using Mongoose)
- **Authentication**: JSON Web Tokens (JWT) & bcrypt
- **External APIs**: 
  - [TMDB API](https://developer.themoviedb.org/docs) (Movie/TV Show Data)
  - [OpenRouter](https://openrouter.ai/) (AI Chatbot)

---

## 🚀 Getting Started

To get WatchWise running locally on your machine, follow these steps:

### Prerequisites
- Node.js installed
- A MongoDB Database URI
- API keys for TMDB and OpenRouter (for the AI chatbot)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd WatchWise
```

### 2. Server Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add the following variables:
```env
PORT=5000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
TMDB_API_KEY=your_tmdb_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
CORS_ORIGINS=http://localhost:5173
```

Start the backend server:
```bash
npm run dev
```

### 3. Client Setup
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory (if needed):
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

---

## 📁 Project Structure

```
WatchWise/
├── client/              # React frontend
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable UI components (Navbar, Chatbot, TrailerPlayer, etc.)
│   │   ├── pages/       # Route-based pages (Dashboard, Login, ContentDetails, etc.)
│   │   ├── services/    # API calls and ThemeContext
│   │   ├── styles/      # Vanilla CSS files alongside Tailwind
│   │   ├── App.jsx      # Main application router
│   │   └── main.jsx     # React entry point
│   ├── package.json
│   └── vite.config.js
└── server/              # Express backend
    ├── middleware/      # JWT authentication middleware
    ├── models/          # Mongoose models (User, Movie, etc.)
    ├── routes/          # Express route handlers (auth, chat, movies, stats, etc.)
    ├── utils/           # Helper functions (TMDB Api calls)
    ├── server.js        # Main Express application setup
    └── package.json
```

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License
This project is licensed under the ISC License.

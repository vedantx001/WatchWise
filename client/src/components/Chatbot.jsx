import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "../styles/chatbot.css";

// SVG Icons for a cleaner look
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 8V4H8"></path>
    <rect x="4" y="12" width="16" height="8" rx="2"></rect>
    <path d="M2 12h2"></path>
    <path d="M20 12h2"></path>
    <path d="M12 12v8"></path>
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function Chatbot({ visible, onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! Ask me about movies, TV shows, or anything else.",
    },
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/chat",
        {
          message: input, 
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      const botMsg = { sender: "bot", text: res.data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chatbot error:", err);
      const botMsg = {
        sender: "bot",
        text: "⚠️ Apologies, I'm having trouble connecting. Please try again later.",
      };
      setMessages((prev) => [...prev, botMsg]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }

  return (
    <div className={`chatbot-container ${visible ? "visible" : ""}`}>
      {/* --- Chat Header --- */}
      <div className="chatbot-header">
        <h3>Movie Assistant</h3>
        <button onClick={onClose} className="close-btn" aria-label="Close Chat">
          <CloseIcon />
        </button>
      </div>

      {/* --- Chat Window --- */}
      <div className="chatbot-messages">
        {messages.map((m, i) => (
          <div key={i} className={`message-container ${m.sender}`}>
            <div className="message-avatar">
              {m.sender === "user" ? <UserIcon /> : <BotIcon />}
            </div>
            <div className={`message-bubble ${m.sender}`}>
              <ReactMarkdown>{m.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <div className="chatbot-input-area">
        <div className="main-input-group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
          />
          <button className="send-btn" onClick={sendMessage} aria-label="Send Message">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "../styles/chatbot.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Enhanced SVG Icons
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM9 9H7V7h2v2zm8 0h-2V7h2v2zm-8 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const MinimizeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const MaximizeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const SparkleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="sparkle-icon"
  >
    <path d="M12 2L13.09 8.26L19 7L15.45 11.82L21 16L14.5 16L12 22L9.5 16L3 16L8.55 11.82L5 7L10.91 8.26L12 2Z"/>
  </svg>
);

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
);


export default function Chatbot({ visible, onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hey there! 👋 I'm your AI movie assistant. Ask me about movies, TV shows, or get personalized recommendations!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (visible && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible, isMinimized]);

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: "user", text: messageText, timestamp };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/chat`,
        {
          message: messageText, 
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      // Simulate typing delay for more natural feel
      setTimeout(() => {
        const botMsg = { 
          sender: "bot", 
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 500);
    } catch (err) {
      console.error("Chatbot error:", err);
      setTimeout(() => {
        const botMsg = {
          sender: "bot",
          text: "😔 I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  // Lock background scroll when chatbot visible (especially on mobile)
  useEffect(() => {
    if (visible) {
      const scrollY = window.scrollY;
      document.body.dataset.chatbotScrollY = String(scrollY);
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.documentElement.classList.add('chatbot-scroll-lock');
    } else {
      const stored = parseInt(document.body.dataset.chatbotScrollY || '0', 10);
      document.documentElement.classList.remove('chatbot-scroll-lock');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, stored);
      delete document.body.dataset.chatbotScrollY;
    }
    return () => {
      document.documentElement.classList.remove('chatbot-scroll-lock');
      if (document.body.style.position === 'fixed') {
        const stored = parseInt(document.body.dataset.chatbotScrollY || '0', 10);
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, stored);
        delete document.body.dataset.chatbotScrollY;
      }
    };
  }, [visible]);

  return (
    <div className={`chatbot-wrapper ${visible ? "visible" : ""}`}>
      <div className={`chatbot-container ${isMinimized ? "minimized" : ""}`}>
        {/* Premium Glass Header */}
        <div className="chatbot-header">
          <div className="header-left">
            <div className="bot-status">
              <div className="status-indicator"></div>
              <div className="header-info">
                <h3>AI Assistant</h3>
                <span className="status-text">Always Online</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setIsMinimized(!isMinimized)} 
              className="header-btn minimize-btn"
              aria-label={isMinimized ? "Expand Chat" : "Minimize Chat"}
              title={isMinimized ? "Expand Chat" : "Minimize Chat"}
            >
              {isMinimized ? <MaximizeIcon /> : <MinimizeIcon />}
            </button>
            <button 
              onClick={onClose} 
              className="header-btn close-btn" 
              aria-label="Close Chat"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area with Premium Styling */}
            <div className="chatbot-messages">
              {/* Welcome section - only show when there's one message */}
              {messages.length === 1 && (
                <div className="welcome-section">
                  <div className="welcome-icon">
                    <SparkleIcon />
                  </div>
                  <p className="welcome-text">How can I help you today?</p>
                </div>
              )}

              {/* Messages */}
              {messages.map((m, i) => (
                <div key={i} className={`message-wrapper ${m.sender}`}>
                  <div className={`message-container ${m.sender}`}>
                    <div className="message-avatar">
                      {m.sender === "user" ? <UserIcon /> : <BotIcon />}
                    </div>
                    <div className="message-content">
                      <div className={`message-bubble ${m.sender}`}>
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                      <span className="message-time">{m.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="message-wrapper bot">
                  <div className="message-container bot">
                    <div className="message-avatar">
                      <BotIcon />
                    </div>
                    <div className="message-content">
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Premium Input Area */}
            <div className="chatbot-input-area">
              <div className="input-container">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about movies..."
                  className="message-input border-none"
                  rows="1"
                />
                <button 
                  className={`send-btn ${input.trim() ? 'active' : ''}`}
                  onClick={() => sendMessage()}
                  aria-label="Send Message"
                  disabled={!input.trim()}
                >
                  <SendIcon />
                </button>
              </div>
              <div className="input-hint">
                Press <kbd>Enter</kbd> to send • <kbd>Shift + Enter</kbd> for new line
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
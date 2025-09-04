import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Chatbot from "./Chatbot";
import { useState } from "react";
import "../styles/layout.css";

function Layout() {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith("/details");
  const [showChatbot, setShowChatbot] = useState(false);

  // SVG for the chat button
  const ChatIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  return (
    <div className="flex flex-col min-h-screen text-white">
      <header className="flex justify-between">
        <Navbar />
      </header>
      <main className="flex-1 bg-[var(--color-background-primary)] dark:bg-[var(--color-background-primary)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}

      {/* Floating Chatbot Button and Window */}
      {!hideFooter && (
        <>
          <button
            className="chatbot-fab"
            onClick={() => setShowChatbot(true)}
            aria-label="Open Chatbot"
          >
            <ChatIcon />
          </button>
          <div className="fixed bottom-20 right-6 z-50">
            <Chatbot visible={showChatbot} onClose={() => setShowChatbot(false)} />
          </div>
        </>
      )}
    </div>
  );
}
export default Layout;
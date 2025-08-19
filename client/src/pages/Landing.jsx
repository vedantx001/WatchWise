import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Landing() {
  return (
    <>
      <Navbar />
      <div
        className="flex flex-col items-center justify-center h-screen bg-[var(--color-background-primary)] dark:bg-[var(--color-background-primary)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]"
      >
        <h1 className="text-5xl font-bold mb-4" style={{ color: "var(--color-accent)" }}>🎬 WatchWise</h1>
        <p className="text-lg mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Track your movies & series, analyze stats, and discover trends!
        </p>
        <div className="flex gap-4">
          <Link
            to="/login"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-background-primary)",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              transition: "background 0.2s"
            }}
            onMouseOver={e => (e.currentTarget.style.background = "#159c8c")}
            onMouseOut={e => (e.currentTarget.style.background = "var(--color-accent)")}
          >
            Login
          </Link>
          <Link
            to="/signup"
            style={{
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              transition: "background 0.2s"
            }}
            onMouseOver={e => (e.currentTarget.style.background = "#e0ded7")}
            onMouseOut={e => (e.currentTarget.style.background = "var(--color-background-secondary)")}
          >
            Signup
          </Link>
          <Link
            to="/trending"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-background-primary)",
              padding: "0.5rem 1.2rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              transition: "background 0.2s"
            }}
            onMouseOver={e => (e.currentTarget.style.background = "#159c8c")}
            onMouseOut={e => (e.currentTarget.style.background = "var(--color-accent)")}
          >
            Trending
          </Link>
        </div>
      </div>
    </>
  );
}

export default Landing;

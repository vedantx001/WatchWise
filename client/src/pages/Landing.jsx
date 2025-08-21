// src/pages/Landing.jsx
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Film, Heart, TrendingUp, BarChart2 } from "lucide-react";
import { Link } from "react-router-dom";

function Landing() {
  const features = [
    {
      title: "AI-Powered Recommendations",
      desc: "Our intelligent algorithm analyzes your viewing habits to suggest movies and shows you'll genuinely love.",
      icon: <Film className="w-10 h-10 text-[var(--color-accent)]" />,
    },
    {
      title: "Unified Watchlist",
      desc: "Consolidate everything into one beautiful, easy-to-manage watchlist, across all your services.",
      icon: <Heart className="w-10 h-10 text-[var(--color-accent)]" />,
    },
    {
      title: "Global Trends Radar",
      desc: "Discover what's buzzing around the world with real-time trending charts and editor's picks.",
      icon: <TrendingUp className="w-10 h-10 text-[var(--color-accent)]" />,
    },
    {
      title: "Personalized Analytics",
      desc: "Get beautiful, insightful dashboards that visualize your habits, favorite genres, and more.",
      icon: <BarChart2 className="w-10 h-10 text-[var(--color-accent)]" />,
    },
  ];

  const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", bounce: 0.4, duration: 0.8 },
    },
  };

  return (
    <div className="bg-[var(--color-background-primary)] text-[var(--color-text-primary)] font-sans transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <motion.div
          className="z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Your Universe of Movies,
            <br />
            <span className="text-[var(--color-accent)]">Perfectly Curated.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[var(--color-text-secondary)]">
            WatchWise is your personal movie concierge. Discover hidden gems, track your must-watch list, and understand your viewing habits like never before.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/signup">
              <motion.button
                className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-white bg-[var(--color-accent)] shadow-lg cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Get Started for Free
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold">Everything You Need in One Place</h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto text-[var(--color-text-secondary)]">
              From discovery to deep dives, WatchWise enhances every step of your movie-watching journey.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-[var(--color-background-secondary)] p-8 rounded-2xl border border-black/10 dark:border-white/10 shadow-lg"
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true, amount: 0.5 }}
                variants={cardVariants}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-[var(--color-text-secondary)] text-lg">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section
        id="cta"
        className="py-24 text-center bg-[var(--color-background-secondary)] px-6 border-t border-black/10 dark:border-white/10"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold">
            Ready to Elevate Your Movie Nights?
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto text-[var(--color-text-secondary)]">
            Join thousands of movie lovers who are already discovering and tracking better. Your next favorite film is just a click away.
          </p>
          <Link to="/signup">
            <motion.button
              className="mt-8 px-10 py-4 rounded-full bg-[var(--color-accent)] text-white font-bold text-lg shadow-lg cursor-pointer"
              whileHover={{ scale: 1.05, opacity: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Sign Up & Start Watching
              <ArrowRight className="inline-block ml-2 -mr-1 w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

export default Landing;
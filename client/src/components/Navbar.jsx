import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Layers, Search, X } from "lucide-react";
import {
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserIcon,
  UserPlusIcon,
  StarIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "./SearchBar";
import GenreSearch from "./GenreSearch";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Theme: default dark, persisted
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored ? stored === "dark" : true;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [genreModalOpen, setGenreModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchOverlayRef = useRef(null);


  // Scroll progress bar
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.2,
  });

  const searchVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: -20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 }
    }
  };
  // Monitor auth token + theme + scroll
  useEffect(() => {
    const checkToken = () => setIsLoggedIn(!!localStorage.getItem("token"));
    checkToken();

    const onStorage = (e) => {
      if (e.key === "token") checkToken();
    };
    window.addEventListener("storage", onStorage);

    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll);

    // Apply theme to html
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // Keyboard shortcuts
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((v) => !v);
      }
      if (e.key === "/" && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setGenreModalOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [isDarkMode, isSearchOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const navItems = useMemo(
    () => [
      { name: "Home", path: "/", icon: HomeIcon },
      { name: "Watchlist", path: "/watchlist", icon: RectangleStackIcon },
      { name: "Dashboard", path: "/dashboard", icon: UserIcon },
      { name: "Trending", path: "/trending", icon: StarIcon },
    ],
    []
  );

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 origin-left h-0.5 z-[60]"
      >
        <div className="w-full h-full bg-[color:var(--color-accent)]" />
      </motion.div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={searchVariants}
          >
            {/* Enhanced backdrop */}
            <motion.div
              className="absolute inset-0 bg-transperant backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div
              ref={searchOverlayRef}
              className="relative w-11/12 md:w-3/4 lg:w-1/2 rounded-2xl shadow-2xl bg-[color:var(--color-background-secondary)]/95 border border-[color:var(--color-background-tertiary)]/50 backdrop-blur-2xl overflow-hidden"
              variants={searchVariants}
            >
              {/* Search header with gradient */}
              <div className="relative p-6 bg-gradient-to-r from-[color:var(--color-accent)]/10 to-purple-500/10 border-b border-[color:var(--color-background-tertiary)]/30">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <Search size={24} className="text-[color:var(--color-accent)]" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)] mb-1">
                      Search Movies & TV Shows
                    </h3>
                    <p className="text-sm text-[color:var(--color-text-secondary)]/70">
                      Find your next favorite content
                    </p>
                  </div>
                  <motion.button
                    onClick={() => setIsSearchOpen(false)}
                    className="p-2 rounded-xl text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-tertiary)] hover:text-[color:var(--color-text-primary)] transition-colors"
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close search"
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>

              {/* Search content */}
              <div className="p-6">
                <SearchBar onSearchSubmit={() => setIsSearchOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <motion.nav
        initial={false}
        animate={{
          y: scrolled ? -2 : 0,
          boxShadow: scrolled
            ? isDarkMode
              ? "0 8px 30px rgba(0,0,0,0.35)"
              : "0 8px 30px rgba(0,0,0,0.10)"
            : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className="fixed top-0 left-0 right-0 z-[65] backdrop-blur-md border-b"
        style={{
          background:
            "color-mix(in srgb, var(--color-background-primary) 85%, transparent)",
          borderColor: "color-mix(in srgb, var(--color-text-secondary) 15%, transparent)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <button
              onClick={() => navigate("/")}
              className="relative group flex items-center gap-2 cursor-pointer"
              aria-label="Go to home"
            >
              <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-300 group-hover:scale-105">
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "radial-gradient(120px 60px at 30% 30%, color-mix(in srgb, var(--color-accent) 35%, transparent), transparent)",
                  }}
                />
                <span
                  className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  <span className="text-white font-bold text-lg">W</span>
                </span>
              </span>
              <span
                className="text-2xl font-extrabold tracking-tight"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, transparent))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                WatchWise
              </span>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map(({ path, name, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <motion.button
                    key={name}
                    onClick={() => navigate(path)}
                    className="relative group px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-all cursor-pointer"
                    whileHover={{ y: -1 }}
                    style={{
                      color: active
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-bg"
                        className="absolute inset-0 rounded-lg -z-10"
                        style={{
                          background:
                            "color-mix(in srgb, var(--color-accent) 14%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}

                    <Icon className="w-5 h-5" />
                    <span>{name}</span>

                    {/* Underline hover */}
                    <span
                      className="pointer-events-none absolute left-3 right-3 -bottom-[3px] h-px scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"
                      style={{ backgroundColor: "var(--color-accent)" }}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                whileTap={{ scale: 0.96 }}
                className="relative p-2 rounded-lg transition-colors cursor-pointer"
                style={{
                  color: "var(--color-text-secondary)",
                }}
                aria-label="Open search (Ctrl/Cmd + K)"
                title="Search (Ctrl/Cmd + K)"
              >
                <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <MagnifyingGlassIcon className="w-5 h-5" />
              </motion.button>

              {/* Genre */}
              <motion.button
                onClick={() => setGenreModalOpen(true)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Search by genre"
                title="Search by genre"
              >
                <span
                  className="absolute inset-0 rounded-lg opacity-0 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent)",
                  }}
                />
                <Layers size={20} />
              </motion.button>

              <GenreSearch
                open={genreModalOpen}
                onClose={() => setGenreModalOpen(false)}
                onSearch={({ movieGenres, tvGenres }) => {
                  const params = new URLSearchParams();
                  if (movieGenres && movieGenres.length)
                    params.set('movieGenres', movieGenres.join(','));
                  if (tvGenres && tvGenres.length)
                    params.set('tvGenres', tvGenres.join(','));
                  navigate(`/search?${params.toString()}`);
                  setGenreModalOpen(false);
                }}
              />

              {/* Theme Toggle */}
              <motion.button
                onClick={() => setIsDarkMode((v) => !v)}
                whileTap={{ rotate: 20, scale: 0.96 }}
                className="p-2 rounded-lg cursor-pointer"
                aria-label="Toggle theme"
                title="Toggle theme"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {isDarkMode ? (
                  <SunIcon className="w-5 h-5 text-yellow-400" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </motion.button>

              {/* Auth */}
              {isLoggedIn ? (
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="hidden md:inline-flex px-3 py-2 rounded-lg font-medium text-white shadow-md transition-colors cursor-pointer"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  Logout
                </motion.button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Login
                  </button>
                  <motion.button
                    onClick={() => navigate("/signup")}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-3 py-2 rounded-lg font-medium text-white shadow-md cursor-pointer"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  >
                    Sign Up
                  </motion.button>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t"
              style={{
                backgroundColor: "var(--color-background-primary)",
                borderColor: "color-mix(in srgb, var(--color-text-secondary) 15%, transparent)",
              }}
            >
              <div className="px-4 py-4 flex flex-col gap-2">
                {navItems.map(({ name, path, icon: Icon }, idx) => (
                  <motion.button
                    key={name}
                    onClick={() => {
                      navigate(path);
                      setIsMobileMenuOpen(false);
                    }}
                    initial={{ x: -8, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.05 * idx }}
                    className="relative flex items-center gap-3 px-3 py-3 rounded-lg text-left cursor-pointer"
                    style={{
                      color: isActive(path)
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                      background: isActive(path)
                        ? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
                        : "transparent",
                      border: isActive(path)
                        ? "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)"
                        : "1px solid transparent",
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{name}</span>
                  </motion.button>
                ))}

                <div
                  className="mt-2 pt-3"
                  style={{
                    borderTop:
                      "1px solid color-mix(in srgb, var(--color-text-secondary) 15%, transparent)",
                  }}
                >
                  {isLoggedIn ? (
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 rounded-lg font-medium text-white cursor-pointer"
                      style={{ backgroundColor: "var(--color-accent)" }}
                    >
                      Logout
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigate("/login");
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex-1 px-4 py-3 rounded-lg font-medium cursor-pointer"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          navigate("/signup");
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex-1 px-4 py-3 rounded-lg font-medium text-white cursor-pointer"
                        style={{ backgroundColor: "var(--color-accent)" }}
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}

export default Navbar;
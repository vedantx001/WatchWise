import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserIcon,
  UserPlusIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import SearchBar from "./SearchBar";


function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  // Default theme is dark unless user has set preference in localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light') return false;
    return true;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Apply theme
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navItems = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Watchlist", path: "/watchlist", icon: Bars3Icon },
    { name: "Dashboard", path: "/dashboard", icon: UserIcon },
    { name: "Trending", path: "/trending", icon: StarIcon},
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Search Modal Overlay (full page) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          style={{ minHeight: '100vh' }}
        >
          <div className="w-full max-w-xl mx-auto px-4">
            <SearchBar onClose={() => setIsSearchOpen(false)} />
          </div>
        </div>
      )}

      <nav className={`bg-[var(--color-background-primary)] dark:bg-[var(--color-background-primary)] 
        fixed top-0 left-0 right-0 z-50
        ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} 
        backdrop-blur-md border-b 
        ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
        transition-all duration-300 ease-in-out

      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div
              className="flex items-center space-x-2 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="relative">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  bg-gradient-to-br from-red-500 to-red-600
                  shadow-lg group-hover:shadow-red-500/25
                  transform group-hover:scale-105 transition-all duration-300
                `}>
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-red-500 to-red-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
              </div>
              <h1 className={`
                text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 
                bg-clip-text text-transparent
                group-hover:from-red-400 group-hover:to-red-500
                transition-all duration-300
              `}>
                WatchWise
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg
                      transition-all duration-300 relative group
                      ${isActive(item.path)
                        ? `${isDarkMode ? 'text-red-400 bg-red-500/10' : 'text-red-600 bg-red-50'}`
                        : `${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                    {isActive(item.path) && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search, Theme Toggle & Auth Buttons */}
            <div className="flex items-center space-x-4">

              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen((prev) => !prev)}
                  className={`
                    p-2 rounded-lg transition-all duration-300
                    ${isDarkMode
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }
                    hover:scale-110
                  `}
                  aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`
                  p-2 rounded-lg transition-all duration-300
                  ${isDarkMode
                    ? 'hover:bg-gray-800 text-yellow-400 hover:text-yellow-300'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }
                  hover:scale-110 hover:rotate-12
                `}
              >
                {isDarkMode ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>

              {/* Auth Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-all duration-300
                      bg-gradient-to-r from-red-500 to-red-600 text-white
                      hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25
                      transform hover:scale-105 active:scale-95
                    `}
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate("/login")}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium
                        transition-all duration-300
                        ${isDarkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }
                        hover:scale-105 active:scale-95
                      `}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Login</span>
                    </button>
                    <button
                      onClick={() => navigate("/signup")}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium
                        bg-gradient-to-r from-red-500 to-red-600 text-white
                        hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25
                        transform hover:scale-105 active:scale-95 transition-all duration-300
                      `}
                    >
                      <UserPlusIcon className="w-4 h-4" />
                      <span>Sign Up</span>
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`
                  md:hidden p-2 rounded-lg transition-all duration-300
                  ${isDarkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }
                `}
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
        <div className={`
          md:hidden transition-all duration-300 ease-in-out overflow-hidden
          ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
          border-t
        `}>
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    flex items-center space-x-3 w-full px-4 py-3 rounded-lg
                    transition-all duration-300
                    ${isActive(item.path)
                      ? `${isDarkMode ? 'text-red-400 bg-red-500/10' : 'text-red-600 bg-red-50'}`
                      : `${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-gray-700 space-y-3">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className={`
                    w-full px-4 py-3 rounded-lg font-medium
                    bg-gradient-to-r from-red-500 to-red-600 text-white
                    hover:from-red-600 hover:to-red-700
                    transition-all duration-300
                  `}
                >
                  Logout
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate("/login");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      flex items-center space-x-3 w-full px-4 py-3 rounded-lg font-medium
                      ${isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                      transition-all duration-300
                    `}
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/signup");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      flex items-center space-x-3 w-full px-4 py-3 rounded-lg font-medium
                      bg-gradient-to-r from-red-500 to-red-600 text-white
                      hover:from-red-600 hover:to-red-700
                      transition-all duration-300
                    `}
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Sign Up</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}

export default Navbar;

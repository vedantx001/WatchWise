import { useNavigate } from "react-router-dom";

function Footer() {
  const navigate = useNavigate();

  return (
    <footer
      className="relative border-t backdrop-blur-md"
      style={{
        backgroundColor: "rgba(31, 31, 31, 0.8)", 
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Gradient Overlay for Premium Look */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-r from-[var(--color-accent)] via-transparent to-[var(--color-accent)]"></div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Left: Logo */}
        <div
          className="flex items-center space-x-2 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          {/* Logo blob */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-md"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            <span className="text-white font-bold text-lg">W</span>
          </div>
          {/* Brand text */}
          <h1
            className="text-lg md:text-xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-accent)] to-red-500 transition-all duration-500 group-hover:brightness-110"
          >
            WatchWise
          </h1>
        </div>

        {/* Middle: Navigation (inline, modern underline effect) */}
        <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
          {[
            { name: "Home", route: "/" },
            { name: "Dashboard", route: "/dashboard" },
            { name: "Trending", route: "/trending" },
            { name: "Watchlist", route: "/watchlist" },
          ].map(({ name, route }) => (
            <button
              key={name}
              onClick={() => navigate(route)}
              className="relative group text-xs md:text-sm font-medium tracking-wide"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span className="transition-colors duration-300 group-hover:text-[var(--color-accent)]">
                {name}
              </span>
              {/* Animated underline */}
              <span
                className="absolute left-0 -bottom-1 w-0 h-0.5 bg-[var(--color-accent)] rounded-full transition-all duration-300 group-hover:w-full"
              ></span>
            </button>
          ))}
        </nav>

        {/* Right: TMDb Badge + Copy */}
        <div className="flex flex-col items-center md:items-end gap-2">
          {/* TMDb Badge */}
          <div
            className="flex items-center px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-[var(--color-accent)]/50 cursor-pointer"
            style={{
              backgroundColor: "#01D277", // TMDb green
              color: "#000000",
            }}
            onClick={() => window.open("https://www.themoviedb.org", "_blank")}
          >
            🎬 Data powered by TMDb
          </div>

          {/* Copyright */}
          <p
            className="text-[10px] md:text-xs italic transition-opacity duration-300 hover:opacity-90"
            style={{ color: "var(--color-text-secondary)" }}
          >
            © {new Date().getFullYear()} WatchWise — Built with ❤️ for movie lovers.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

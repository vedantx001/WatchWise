import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? (el.scrollTop / max) * 100 : 0;
      setScrollPct(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      role="contentinfo"
      className="relative border-t backdrop-blur-sm"
      style={{
        background: "var(--color-background-primary)",
        borderColor:
          "color-mix(in srgb, var(--color-text-secondary) 15%, transparent)",
      }}
    >
      {/* Shimmer hairline border */}
      <div
        aria-hidden
        className="absolute -top-px left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-accent) 80%, transparent), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group cursor-pointer"
          aria-label="Go to home"
        >
          <span
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white font-bold shadow-md transition-transform group-hover:scale-110"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, black))",
            }}
          >
            W
          </span>
          <span
            className="text-lg font-extrabold bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, transparent))",
            }}
          >
            WatchWise
          </span>
        </button>

        {/* Navigation */}
        <nav
          className="flex flex-wrap justify-center gap-6 text-sm font-medium"
          aria-label="Footer"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {[
            { name: "Home", path: "/" },
            { name: "Dashboard", path: "/dashboard" },
            { name: "Trending", path: "/trending" },
            { name: "Watchlist", path: "/watchlist" },
          ].map(({ name, path }) => (
            <button
              key={name}
              onClick={() => navigate(path)}
              className="relative group cursor-pointer"
            >
              <span className="transition-colors group-hover:text-[var(--color-accent)]">
                {name}
              </span>
              <span
                className="absolute left-0 -bottom-0.5 w-0 h-0.5 transition-all group-hover:w-full"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
            </button>
          ))}
        </nav>

        {/* Credits + Back to top */}
        <div
          className="flex flex-col items-center md:items-end gap-3 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <button
            type="button"
            onClick={() =>
              window.open("https://www.themoviedb.org", "_blank", "noopener,noreferrer")
            }
            className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition cursor-pointer"
            style={{ backgroundColor: "#01D277", color: "#000" }}
            aria-label="Open TMDb website"
          >
            🎬 Data powered by TMDb
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer"
              title="Back to top"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--color-text-secondary) 18%, transparent)",
              }}
            >
              <span
                className="grid place-items-center w-6 h-6 rounded-full"
                aria-hidden
                style={{
                  background: `conic-gradient(var(--color-accent) ${scrollPct}%, color-mix(in srgb, var(--color-text-secondary) 20%, transparent) ${scrollPct}%)`,
                }}
              >
                <span
                  className="w-[18px] h-[18px] rounded-full"
                  style={{
                    background:
                      "color-mix(in srgb, var(--color-background-primary) 92%, transparent)",
                  }}
                />
              </span>
              <ArrowUp
                size={16}
                className="opacity-80 group-hover:opacity-100 transition"
                style={{ color: "var(--color-text-secondary)" }}
              />
              <span className="font-medium" style={{ color: "var(--color-text-secondary)" }}>
                Top
              </span>
            </button>

            <span className="hidden sm:inline text-[11px] opacity-70">
              Tip: Press / to search • Ctrl/Cmd + K for command palette
            </span>
          </div>

          <p className="italic">&copy; {year} WatchWise — For movie lovers ❤️</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
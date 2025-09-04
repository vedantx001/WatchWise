import { useNavigate } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

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

  const scrollToTop = () => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  return (
    <footer
      className="border-t backdrop-blur-sm"
      style={{
        background: "var(--color-background-primary)",
        borderColor:
          "color-mix(in srgb, var(--color-text-secondary) 12%, transparent)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group"
          aria-label="Go to home"
        >
          <span
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white font-bold shadow-md group-hover:scale-110 transition"
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
          className="flex gap-6 text-sm font-medium"
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
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              {name}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* TMDb credit */}
          <button
            type="button"
            onClick={() =>
              window.open(
                "https://www.themoviedb.org",
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm hover:shadow-md transition"
            style={{ backgroundColor: "#01D277", color: "#000" }}
          >
            Powered by TMDb
          </button>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition"
            style={{
              borderColor:
                "color-mix(in srgb, var(--color-text-secondary) 20%, transparent)",
              color: "var(--color-text-secondary)",
            }}
            title="Back to top"
          >
            <ArrowUp size={14} />
            Top
          </button>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="border-t mt-4"
        style={{ borderColor: "color-mix(in srgb, var(--color-text-secondary) 10%, transparent)" }}
      >
        <p className="text-center text-xs py-4 opacity-70">
          © {year} WatchWise • All rights reserved
        </p>
      </div>
    </footer>
  );
}

export default Footer;

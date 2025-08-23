import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getTrendingMovies, getTrendingTVShows } from "../services/tmdb";
import {
  getTrendingBollywood,
  getUpcomingBollywood,
  getUpcomingHollywood,
} from "../services/bollywood";
import "../styles/trending.css";
import fallbackPoster from "../assets/fallback_poster2.png";

const IMG = {
  poster185: "https://image.tmdb.org/t/p/w185",
  poster342: "https://image.tmdb.org/t/p/w342",
};

const CARD_W = 184;
const POSTER_W = CARD_W;
const POSTER_H = Math.round(CARD_W * 1.5);

const formatRating = (v) => (v ? v.toFixed(1) : "N/A");
const getYear = (item) => {
  const d = item.release_date || item.first_air_date;
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : new Date(d).getFullYear();
};

const IconStar = ({ className = "w-4 h-4", accentColor = "var(--color-accent)" }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={accentColor}
    aria-hidden="true"
  >
    <path d="M12 .587l3.668 7.431L24 9.748l-6 5.85 1.416 8.26L12 19.771 4.584 23.86 6 15.598 0 9.748l8.332-1.73z" />
  </svg>
);

const IconChevron = ({ dir = "left", className = "w-5 h-5", accentColor = "var(--color-text-primary)" }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={accentColor}
    aria-hidden="true"
  >
    {dir === "left" ? (
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    ) : (
      <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
    )}
  </svg>
);

const spring = { type: "spring", bounce: 0.25, duration: 0.6 };

function PosterImage({ path, alt, className = "", width = POSTER_W, height = POSTER_H }) {
  const [loaded, setLoaded] = useState(false);
  const src = path ? `${IMG.poster342}${path}` : fallbackPoster;
  const srcSet = path ? `${IMG.poster185}${path} 185w, ${IMG.poster342}${path} 342w` : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={`${width}px`}
      alt={alt}
      width={width}
      height={height}
      className={`w-full h-auto object-cover ${className}`}
      style={{
        filter: loaded ? "none" : "blur(10px)",
        transform: loaded ? "none" : "scale(1.04)",
        transition: "filter 300ms ease, transform 300ms ease",
        background: "var(--color-background-primary)",
      }}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        e.currentTarget.src = fallbackPoster;
        e.currentTarget.srcset = "";
        setLoaded(true);
      }}
      draggable={false}
    />
  );
}

function SkeletonCard() {
  return (
    <div
      className="trending-card flex-shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-white/5 dark:bg-white/5"
      style={{ width: CARD_W }}
    >
      <div className="skeleton" style={{ width: CARD_W, height: POSTER_H }} />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-36 rounded" />
        <div className="flex justify-between">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-4 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}

const Section = ({ title, items, loading, onCardClick }) => {
  const containerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scrollBy = (dir = 1) => {
    const el = containerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth - 100, 360);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <motion.section
      className="mb-14 relative"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
      viewport={{ once: true, amount: 0.2 }}
      style={{
        color: "var(--color-text-primary)",
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <motion.h2
          className="trending-title font-extrabold text-2xl md:text-3xl select-none bg-[var(--color-accent)] bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h2>

        <div className="flex items-center gap-2">
          <motion.button
            className={`scroll-btn cursor-pointer ${canLeft ? "opacity-100" : "opacity-40 pointer-events-none"}`}
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            whileTap={{ scale: 0.95 }}
            style={{
              color: "var(--color-text-primary)",
              background: "var(--color-background-secondary)",
              borderRadius: "9999px",
              padding: "8px",
              boxShadow: "0 1px 5px rgb(0 0 0 / 0.1)",
              border: "none",
            }}
          >
            <IconChevron dir="left" accentColor="var(--color-text-primary)" />
          </motion.button>
          <motion.button
            className={`scroll-btn cursor-pointer ${canRight ? "opacity-100" : "opacity-40 pointer-events-none"}`}
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            whileTap={{ scale: 0.95 }}
            style={{
              color: "var(--color-text-primary)",
              background: "var(--color-background-secondary)",
              borderRadius: "9999px",
              padding: "8px",
              boxShadow: "0 1px 5px rgb(0 0 0 / 0.1)",
              border: "none",
            }}
          >
            <IconChevron dir="right" accentColor="var(--color-text-primary)" />
          </motion.button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="trending-grid horizontal-scroll snap-x snap-mandatory"
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "1rem",
          paddingBottom: "0.5rem",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE 10+
        }}
      >
        <AnimatePresence initial={false}>
          {loading
            ? Array.from({ length: 10 }).map((_, idx) => <SkeletonCard key={`s-${idx}`} />)
            : items.map((item) => {
                const title = item.title || item.name;
                const year = getYear(item);
                const rating = formatRating(item.vote_average);
                const media = item.media_type === "tv" ? "TV Show" : "Movie";

                return (
                  <motion.div
                    key={item.id}
                    className="trending-card group relative flex-shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer select-none snap-start overflow-hidden"
                    style={{ width: CARD_W, color: "var(--color-text-primary)" }}
                    onClick={() => onCardClick(item)}
                    initial={{ y: 24, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1, transition: spring }}
                    viewport={{ once: true, amount: 0.25 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${title} - ${media}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onCardClick(item);
                    }}
                  >
                    <div className="relative">
                      <div className="relative overflow-hidden rounded-2xl">
                        <PosterImage
                          path={item.poster_path}
                          alt={title}
                          width={POSTER_W}
                          height={POSTER_H}
                          className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        />
                      </div>

                      {/* Chips */}
                      <div className="absolute top-2 left-2 flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide bg-[var(--color-accent)] text-[var(--color-background-primary)]"
                        >
                          {media}
                        </span>
                      </div>

                      <div
                        className="absolute top-2 right-2 flex items-center gap-1 rounded-full backdrop-blur px-2 py-1 text-[10px] font-semibold"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          color: "#FFDD57",
                          boxShadow: "0 0 5px 1px rgba(255 221 87 / 0.6)",
                          ring: "1px solid rgba(255 221 87 / 0.6)",
                        }}
                      >
                        <IconStar className="w-3.5 h-3.5" accentColor="#FFDD57" />
                        {rating}
                      </div>

                      {/* Hover overlay + CTA */}
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <motion.button
                        className="absolute bottom-2 left-2 right-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg bg-[var(--color-accent)] text-[var(--color-background-primary)] text-xs font-semibold py-1.5 hover:bg-[var(--color-accent)]/90"
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardClick(item);
                        }}
                      >
                        View details
                      </motion.button>
                    </div>

                    {/* Base meta */}
                    <div className="p-3">
                      <h3
                        className="font-semibold text-sm leading-5 line-clamp-2"
                        title={title}
                      >
                        {title}
                      </h3>
                      <div className="mt-1 flex items-center justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        <span>{year || "—"}</span>
                        <span className="inline-flex items-center gap-1 font-medium" style={{ color: "var(--color-text-primary)" }}>
                          <IconStar className="w-3.5 h-3.5" accentColor="#FFDD57" />
                          {rating}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

const Trending = () => {
  const [hollywood, setHollywood] = useState([]);
  const [tvShows, setTVShows] = useState([]);
  const [bollywood, setBollywood] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [movieData, tvData, bollyData, upBol, upHol] = await Promise.all([
          getTrendingMovies(),
          getTrendingTVShows(),
          getTrendingBollywood(),
          getUpcomingBollywood(),
          getUpcomingHollywood(),
        ]);
        if (!isMounted) return;
        setHollywood(movieData || []);
        setTVShows(tvData || []);
        setBollywood(bollyData || []);
        const allUpcoming = [...(upBol || []), ...(upHol || [])].filter((m) => m.poster_path);
        allUpcoming.sort(
          (a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0)
        );
        setUpcoming(allUpcoming);
        setErr(null);
      } catch (e) {
        console.error(e);
        if (isMounted) setErr("Failed to load content. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCardClick = (item) => {
    navigate(`/details/${item.media_type || "movie"}/${item.id}`);
  };

  return (
    <div
      id="sections"
      className="trending-container min-h-screen bg-[var(--color-background-primary)] text-[var(--color-text-primary)] px-4 md:px-8 py-8"
    >
      {err && (
        <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 px-4 py-3">
          {err}
        </div>
      )}

      <Section
        title="Hollywood Trending"
        items={hollywood.map((m) => ({ ...m, media_type: "movie" }))}
        loading={loading && !hollywood.length}
        onCardClick={handleCardClick}
      />
      <Section
        title="Bollywood Trending"
        items={bollywood.map((m) => ({ ...m, media_type: "movie" }))}
        loading={loading && !bollywood.length}
        onCardClick={handleCardClick}
      />
      <Section
        title="Trending TV Shows"
        items={tvShows.map((m) => ({ ...m, media_type: "tv" }))}
        loading={loading && !tvShows.length}
        onCardClick={handleCardClick}
      />
      <Section
        title="Upcoming Hits"
        items={upcoming.map((m) => ({ ...m, media_type: "movie" }))}
        loading={loading && !upcoming.length}
        onCardClick={handleCardClick}
      />
    </div>
  );
};

export default Trending;

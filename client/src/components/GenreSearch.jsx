import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// All TMDb movie genres as of 2025
const MOVIE_GENRES = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
];

// All TMDb TV genres as of 2025
const TV_GENRES = [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10763, name: 'News' },
    { id: 10764, name: 'Reality' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10766, name: 'Soap' },
    { id: 10767, name: 'Talk' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' },
];

const cn = (...classes) => classes.filter(Boolean).join(' ');

function Spinner({ className = 'h-4 w-4 text-white' }) {
    return (
        <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

function ChipButton({ selected, onClick, children, title, className }) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            title={title}
            aria-pressed={selected}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            layout
            className={cn(
                'px-3 py-1.5 rounded-full border text-sm font-medium transition-all focus:outline-none',
                'focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 dark:focus:ring-offset-zinc-900',
                selected
                    ? 'bg-[color:var(--color-accent)] text-white border-[color:var(--color-accent)] shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-[color:var(--color-accent)]/10 hover:border-[color:var(--color-accent)]/40',
                className
            )}
        >
            {children}
        </motion.button>
    );
}

export default function GenreSearchModal({ open, onClose, onSearch }) {
    const [selectedMovieGenres, setSelectedMovieGenres] = useState([]);
    const [selectedTvGenres, setSelectedTvGenres] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('all');
    const [filterTerm, setFilterTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('movies'); // for mobile

    const overlayRef = useRef(null);
    const panelRef = useRef(null);
    const closeBtnRef = useRef(null);
    const prevActiveElementRef = useRef(null);

    const normalizedFilter = filterTerm.trim().toLowerCase();
    const filteredMovieGenres = useMemo(
        () =>
            normalizedFilter
                ? MOVIE_GENRES.filter((g) => g.name.toLowerCase().includes(normalizedFilter))
                : MOVIE_GENRES,
        [normalizedFilter]
    );
    const filteredTvGenres = useMemo(
        () =>
            normalizedFilter
                ? TV_GENRES.filter((g) => g.name.toLowerCase().includes(normalizedFilter))
                : TV_GENRES,
        [normalizedFilter]
    );

    const totalSelected = selectedMovieGenres.length + selectedTvGenres.length;

    const toggleGenre = (id, type) => {
        if (type === 'movie') {
            setSelectedMovieGenres((prev) =>
                prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
            );
        } else {
            setSelectedTvGenres((prev) =>
                prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
            );
        }
    };

    const clearMovies = () => setSelectedMovieGenres([]);
    const clearTv = () => setSelectedTvGenres([]);
    const clearAll = () => {
        setSelectedMovieGenres([]);
        setSelectedTvGenres([]);
        setFilterTerm('');
    };

    const removeChip = (id, type) => {
        if (type === 'movie') setSelectedMovieGenres((prev) => prev.filter((g) => g !== id));
        else setSelectedTvGenres((prev) => prev.filter((g) => g !== id));
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            await onSearch({
                movieGenres: selectedMovieGenres,
                tvGenres: selectedTvGenres,
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    // Backdrop click closes modal (click inside panel doesn't close)
    const onBackdropClick = (e) => {
        if (e.target === overlayRef.current) onClose?.();
    };

    // Focus trap, ESC to close, body scroll lock
    useEffect(() => {
        if (!open) return;
        prevActiveElementRef.current = document.activeElement;
        document.body.style.overflow = 'hidden';

        // Focus close button by default
        const t = setTimeout(() => {
            closeBtnRef.current?.focus();
        }, 20);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose?.();
            }
            if (e.key === 'Tab') {
                const container = panelRef.current;
                if (!container) return;
                const focusable = container.querySelectorAll(
                    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
                );
                const focusables = Array.from(focusable);
                if (focusables.length === 0) {
                    e.preventDefault();
                    return;
                }
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(t);
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
            // restore focus
            prevActiveElementRef.current?.focus?.();
        };
    }, [open, onClose]);

    // Drag-to-close (mobile-friendly)
    const handleDragEnd = (_, info) => {
        const { velocity, offset } = info;
        if (offset.y > 120 || velocity.y > 600) {
            onClose?.();
        }
    };

    const panelVariants = {
        hidden: { opacity: 0, y: 24, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 420, damping: 30 },
        },
        exit: { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18 } },
    };

    const listVariants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.01, delayChildren: 0.02 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 4 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.12 } },
    };

    const labelId = 'genre-modal-title';
    const descId = 'genre-modal-desc';

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={overlayRef}
                    // --- THIS IS THE FIXED LINE FOR TRUE CENTERING ---
                    className="pt-80 fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
                    onMouseDown={onBackdropClick}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-hidden="true"
                >
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={labelId}
                        aria-describedby={descId}
                        className={cn(
                            'relative w-full max-w-2xl bg-white/80 dark:bg-zinc-900/80',
                            'rounded-2xl shadow-2xl border border-zinc-300 dark:border-zinc-800',
                            'p-4 sm:p-7 md:p-8',
                            'backdrop-blur-[6px] backdrop-saturate-150',
                            'transition-all duration-200',
                            'max-h-[90vh] overflow-y-auto'
                        )}
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={onClose}
                            className={cn(
                                'absolute right-3 top-3 inline-flex items-center justify-center rounded-lg',
                                'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100',
                                'hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80',
                                'focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 dark:focus:ring-offset-zinc-900',
                                'h-9 w-9'
                            )}
                            aria-label="Close dialog"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-90" aria-hidden="true">
                                <path
                                    d="M6 6l12 12M18 6L6 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {/* Header */}
                        <div className="mb-4 sm:mb-5">
                            <h2
                                id={labelId}
                                className="text-2xl sm:text-3xl font-bold tracking-tight text-center md:text-left"
                            >
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[color:var(--color-accent)] to-[color:var(--color-accent-dark,#4338CA)]">
                                    Search by Genre
                                </span>{' '}
                            </h2>
                            <p id={descId} className="sr-only">
                                Choose one or more movie and TV genres, and search.
                            </p>
                        </div>

                        {/* Selected Chips */}
                        <AnimatePresence initial={false}>
                            {totalSelected > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="mb-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 p-3"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                            Selected ({totalSelected})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={clearAll}
                                            className="text-xs font-medium text-[color:var(--color-accent)] hover:underline"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    <motion.div
                                        className="flex flex-wrap gap-2"
                                        variants={listVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {selectedMovieGenres.map((id) => {
                                            const g = MOVIE_GENRES.find((x) => x.id === id);
                                            if (!g) return null;
                                            return (
                                                <motion.div key={`m-${id}`} variants={itemVariants} layout>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeChip(id, 'movie')}
                                                        className="group px-2.5 py-1 rounded-full text-xs font-medium border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/15 transition-all flex items-center gap-1.5"
                                                    >
                                                        <span className="inline-block rounded bg-[color:var(--color-accent)] text-white px-1.5 py-0.5 text-[10px]">
                                                            Movie
                                                        </span>
                                                        {g.name}
                                                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="opacity-80">
                                                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                        </svg>
                                                        <span className="sr-only">Remove {g.name} (movie)</span>
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                        {selectedTvGenres.map((id) => {
                                            const g = TV_GENRES.find((x) => x.id === id);
                                            if (!g) return null;
                                            return (
                                                <motion.div key={`t-${id}`} variants={itemVariants} layout>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeChip(id, 'tv')}
                                                        className="group px-2.5 py-1 rounded-full text-xs font-medium border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/15 transition-all flex items-center gap-1.5"
                                                    >
                                                        <span className="inline-block rounded bg-[color:var(--color-accent)] text-white px-1.5 py-0.5 text-[10px]">
                                                            TV
                                                        </span>
                                                        {g.name}
                                                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="opacity-80">
                                                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                        </svg>
                                                        <span className="sr-only">Remove {g.name} (TV)</span>
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Filter + Mobile Tabs */}
                        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="relative w-full md:max-w-sm">
                                <input
                                    type="text"
                                    value={filterTerm}
                                    onChange={(e) => setFilterTerm(e.target.value)}
                                    placeholder="Filter genres…"
                                    className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                                />
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M21 21l-4.3-4.3M10 18a8 8 0 110-16 8 8 0 010 16z"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {filterTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setFilterTerm('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        aria-label="Clear filter"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Mobile segmented control */}
                            <div className="flex md:hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
                                {['movies', 'tv'].map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            'flex-1 px-3 py-1.5 rounded-md text-sm font-semibold transition-all',
                                            activeTab === tab
                                                ? 'bg-[color:var(--color-accent)] text-white shadow'
                                                : 'text-zinc-700 dark:text-zinc-200'
                                        )}
                                    >
                                        {tab === 'movies' ? 'Movies' : 'TV'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Genre Grids */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] gap-6 mb-8 items-start">
                            {/* Movies */}
                            <div className={cn('flex-1', 'md:block', activeTab === 'movies' ? 'block' : 'hidden md:block')}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-lg">Movie Genres</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-zinc-500">
                                            {selectedMovieGenres.length} selected
                                        </span>
                                        {selectedMovieGenres.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={clearMovies}
                                                className="text-xs font-medium text-[color:var(--color-accent)] hover:underline"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <motion.div
                                    className="flex flex-wrap gap-2"
                                    style={{ minHeight: '48px' }}
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {filteredMovieGenres.map((genre) => {
                                        const isSelected = selectedMovieGenres.includes(genre.id);
                                        return (
                                            <motion.div key={genre.id} variants={itemVariants} layout>
                                                <ChipButton
                                                    selected={isSelected}
                                                    onClick={() => toggleGenre(genre.id, 'movie')}
                                                    title={genre.name}
                                                >
                                                    {genre.name}
                                                </ChipButton>
                                            </motion.div>
                                        );
                                    })}
                                    {filteredMovieGenres.length === 0 && (
                                        <div className="text-sm text-zinc-500">No genres match your filter.</div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Divider for desktop */}
                            <div className="hidden md:block h-full w-px bg-zinc-300 dark:bg-zinc-800 mx-2 rounded-full" />

                            {/* TV */}
                            <div className={cn('flex-1', 'md:block', activeTab === 'tv' ? 'block' : 'hidden md:block')}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-lg">TV Show Genres</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-zinc-500">
                                            {selectedTvGenres.length} selected
                                        </span>
                                        {selectedTvGenres.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={clearTv}
                                                className="text-xs font-medium text-[color:var(--color-accent)] hover:underline"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <motion.div
                                    className="flex flex-wrap gap-2"
                                    style={{ minHeight: '48px' }}
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {filteredTvGenres.map((genre) => {
                                        const isSelected = selectedTvGenres.includes(genre.id);
                                        return (
                                            <motion.div key={genre.id} variants={itemVariants} layout>
                                                <ChipButton
                                                    selected={isSelected}
                                                    onClick={() => toggleGenre(genre.id, 'tv')}
                                                    title={genre.name}
                                                >
                                                    {genre.name}
                                                </ChipButton>
                                            </motion.div>
                                        );
                                    })}
                                    {filteredTvGenres.length === 0 && (
                                        <div className="text-sm text-zinc-500">No genres match your filter.</div>
                                    )}
                                </motion.div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    'px-4 py-2 rounded-lg text-white font-semibold transition-all',
                                    'bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark,#4338CA)]',
                                    'focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 dark:focus:ring-offset-zinc-900',
                                    'disabled:opacity-60 disabled:cursor-not-allowed'
                                )}
                                onClick={handleSearch}
                                disabled={
                                    loading || (selectedMovieGenres.length === 0 && selectedTvGenres.length === 0)
                                }
                            >
                                <span className="inline-flex items-center gap-2">
                                    {loading && <Spinner />}
                                    {loading ? 'Searching…' : 'Search'}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

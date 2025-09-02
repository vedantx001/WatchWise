import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "../api"; // Your API instance
import "../styles/dashboard.css"; // Your custom styles

function Dashboard() {
  const [contentTypeFilter, setContentTypeFilter] = useState("movie"); // 'movie' or 'tv'
  const [timeFilter, setTimeFilter] = useState("overall"); // 'overall', 'year', 'month'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showAllTop, setShowAllTop] = useState(false);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        // Map frontend filter state to backend query parameter
        const period = {
          year: "thisYear",
          month: "thisMonth",
        }[timeFilter] || "overall";

        const res = await api.get("/stats", {
          params: { contentType: contentTypeFilter, period }
        });
        console.log("Fetched stats:", res.data);
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setStats(null); // Clear stats on error
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, [contentTypeFilter, timeFilter]);

  // Define themes based on content type
  const theme = {
    movie: {
      accent: "amber",
      mainText: "text-amber-400",
      secondaryText: "text-amber-500",
      bg: "bg-amber-500",
      border: "border-amber-500",
      fill: "#f59e0b",
    },
    tv: {
      accent: "sky",
      mainText: "text-sky-400",
      secondaryText: "text-sky-500",
      bg: "bg-sky-500",
      border: "border-sky-500",
      fill: "#38bdf8",
    },
  };
  const activeTheme = theme[contentTypeFilter];

  if (loading) {
    return <div className="p-8 text-center text-lg text-[var(--color-text-primary)] dark:text-white">Loading dashboard...</div>;
  }

  // Check if there are any stats to display
  if (!stats || !stats.stats || Object.keys(stats.stats).length === 0) {
    return (
      <div className="min-h-screen font-sans p-4 md:p-8 bg-[var(--color-background-primary)] text-[var(--color-text-primary)] dark:text-white">
        <div className="max-w-4xl mx-auto">
          <ContentTypeSelector
            contentTypeFilter={contentTypeFilter}
            setContentTypeFilter={setContentTypeFilter}
            theme={theme}
          />
          <div className="text-center py-20 rounded-lg bg-[var(--color-background-secondary)] dark:bg-gray-800 border border-transparent dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-2 text-[var(--color-text-primary)] dark:text-white">No Data Available</h2>
            <p className="text-[var(--color-text-primary)] dark:text-gray-400">There's no completed content to show for this period.</p>
          </div>
        </div>
      </div>
    );
  }

  const { stats: mainStats, dailyActivity, top5 = [], top10 = [] } = stats;
  const topList = showAllTop && top10.length > 0 ? top10 : top5;
  // Helper to format watch time (Xd Yh Zm)
  const formatWatchTime = (minutes) => {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    return `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${mins > 0 ? `${mins}m` : ""}`.trim();
  };

  return (
    <div className="min-h-screen font-sans p-4 md:p-8 bg-[var(--color-background-primary)] text-[var(--color-text-primary)] dark:text-white">
      <div className="max-w-4xl mx-auto">
        {/* Content Type Selector */}
        <ContentTypeSelector
          contentTypeFilter={contentTypeFilter}
          setContentTypeFilter={setContentTypeFilter}
          theme={theme}
        />

        {/* Time Filter Selector */}
        <div className="flex justify-center space-x-2 md:space-x-4 mb-8">
          <StatsFilterButton title="Overall stats" isActive={timeFilter === 'overall'} onClick={() => setTimeFilter('overall')} theme={activeTheme} />
          <StatsFilterButton title="This year" isActive={timeFilter === 'year'} onClick={() => setTimeFilter('year')} theme={activeTheme} />
          <StatsFilterButton title="This month" isActive={timeFilter === 'month'} onClick={() => setTimeFilter('month')} theme={activeTheme} />
        </div>

        {/* --- Stats Grid --- */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            {contentTypeFilter === 'movie' ? (
              <>
                <StatCard title="Watch count" value={mainStats.watchCount ?? 'N/A'} />
                <StatCard title="Avg. rate" value={formatRating(mainStats.avgRate)} />
                <StatCard title="Best rated movie" value={mainStats.bestRatedMovie ?? 'N/A'} />
                <StatCard title="Best rate" value={formatRating(mainStats.bestRate)} />
                <StatCard title="Worst rated movie" value={mainStats.worstRatedMovie ?? 'N/A'} />
                <StatCard title="Worst rate" value={formatRating(mainStats.worstRate)} />
                <StatCard title="Favorite genre" value={mainStats.favoriteGenre ?? 'N/A'} />
                <StatCard title="Watch time" value={formatWatchTime(mainStats.watchTime)} />
              </>
            ) : (
              <>
                <StatCard title="TV series watched" value={mainStats.tvSeriesWatched ?? 'N/A'} />
                <StatCard title="Seasons watched" value={mainStats.watchCount ?? 'N/A'} />
                <StatCard title="Episodes watched" value={mainStats.episodesWatched ?? 'N/A'} />
                <StatCard title="Avg. rate" value={formatRating(mainStats.avgRate)} />
                <StatCard title="Best rated TV series" value={mainStats.bestRatedTVSeries ?? 'N/A'} />
                <StatCard title="Best rate" value={formatRating(mainStats.bestRate)} />
                <StatCard title="Worst rated TV series" value={mainStats.worstRatedTVSeries ?? 'N/A'} />
                <StatCard title="Worst rate" value={formatRating(mainStats.worstRate)} />
                <StatCard title="Favorite genre" value={mainStats.favoriteGenre ?? 'N/A'} />
                <StatCard title="Watch time" value={formatWatchTime(mainStats.watchTime)} />
              </>
            )}
          </div>
        </div>

        {/* --- Daily Activity Chart --- */}
        <div className="p-4 rounded-lg mb-8 bg-[var(--color-background-secondary)] border border-[color:color-mix(in_srgb,var(--color-text-secondary)_12%,transparent)]">
          <h3 className="text-xl font-bold mb-4 text-[var(--color-text-primary)] ">Your daily activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyActivity} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis type="number" stroke="#9ca3af" domain={[0, 'dataMax + 1']} allowDecimals={false} />
              <YAxis type="category" dataKey="day" stroke="#9ca3af" width={40} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-background-secondary)', 
                  border: '1px solid color-mix(in srgb, var(--color-text-secondary) 25%, transparent)', 
                  color: 'var(--color-text-primary)'
                }} 
                itemStyle={{ color: 'var(--color-text-primary)' }} 
                labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
                cursor={{ fill: 'color-mix(in srgb, var(--color-text-secondary) 20%, transparent)' }} 
              />
              <Bar dataKey="count" barSize={15}>
                {dailyActivity.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={activeTheme.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- Top 5/10 List --- */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Your top {showAllTop ? 10 : 5}</h3>
            {top10.length > 5 && (
              <button
                onClick={() => setShowAllTop(!showAllTop)}
                className="px-3 py-1 rounded-lg font-semibold text-sm transition-colors duration-200 bg-[color:color-mix(in_srgb,var(--color-text-secondary)_18%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--color-text-secondary)_26%,transparent)] text-[var(--color-text-primary)]"
              >
                {showAllTop ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {topList.map((item, index) => (
              <div key={item.id || item.title} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background-secondary)] border border-[color:color-mix(in_srgb,var(--color-text-secondary)_12%,transparent)]">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-bold w-6 text-center text-lg text-[var(--color-text-primary)] dark:text-gray-400">{index + 1}</span>
                  <p className="truncate font-medium text-[var(--color-text-primary)]">{item.title}</p>
                </div>
                <span className={`font-bold text-lg px-3 py-1 rounded-md ${activeTheme.bg} text-[var(--color-text-primary)] dark:text-gray-900`}>
                  {formatRating(item.rating)}
                </span>
              </div>
            ))}
            {topList.length === 0 && (
              <p className="text-center text-[var(--color-text-primary)] dark:text-gray-400">No rated items available for this period.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Reusable Sub-components ---

const ContentTypeSelector = ({ contentTypeFilter, setContentTypeFilter, theme }) => (
  <div className="flex justify-center border-b border-gray-700 mb-6 sticky top-0 bg-[var(--color-background-primary)] z-10 py-2">
    <TabButton title="Movies" isActive={contentTypeFilter === 'movie'} onClick={() => setContentTypeFilter('movie')} theme={theme.movie} />
    <TabButton title="TV Series" isActive={contentTypeFilter === 'tv'} onClick={() => setContentTypeFilter('tv')} theme={theme.tv} />
  </div>
);

const TabButton = ({ title, isActive, onClick, theme }) => (
  <button onClick={onClick} className={`px-4 py-2 text-lg font-semibold transition-colors duration-300 ${isActive ? `text-[var(--color-text-primary)] dark:${theme.mainText} border-b-2 border-[var(--color-text-primary)] dark:${theme.border}` : "text-[var(--color-text-primary)] dark:text-gray-400 border-b-2 border-transparent hover:text-[var(--color-text-primary)]"}`}>
  {title}
  </button>
);

const StatsFilterButton = ({ title, isActive, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-colors duration-300 ${isActive
        ? `${theme.bg} text-[var(--color-text-primary)] dark:text-white`
        : "bg-[color:color-mix(in_srgb,var(--color-text-secondary)_15%,transparent)] text-[var(--color-text-primary)] hover:bg-[color:color-mix(in_srgb,var(--color-text-secondary)_25%,transparent)]"
      }`}
  >
  {title}
  </button>
);

const StatCard = ({ title, value }) => (
  <div className="p-4 rounded-lg flex flex-col justify-center min-h-[90px] bg-[var(--color-background-secondary)] border border-[color:color-mix(in_srgb,var(--color-text-secondary)_12%,transparent)]">
    <p className="text-sm text-[var(--color-text-primary)] dark:text-gray-400">{title}</p>
    <p className="text-2xl font-bold mt-1 truncate text-[var(--color-text-primary)]">{value ?? 'N/A'}</p>
  </div>
);

// --- Helper to format rating display ---
function formatRating(r) {
  if (r == null || isNaN(r)) return "N/A";
  const num = Number(r);
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
}

export default Dashboard;
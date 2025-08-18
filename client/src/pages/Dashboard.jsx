import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "../api";
import { Link } from "react-router-dom"; // Import Link for top rated items
import "../styles/dashboard.css"; // Ensure this CSS file exists and is correctly linked

// --- Helper Icons (using SVG for simplicity) ---
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const GenreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>;


function Dashboard() {
  const [contentTypeFilter, setContentTypeFilter] = useState("all"); // 'all', 'movie', or 'tv'
  const [timeFilter, setTimeFilter] = useState("overall"); // 'overall', 'year', 'month'
  const [showAllTop, setShowAllTop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null); // Will hold all comprehensive stats from backend

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        const params = {
          contentType: contentTypeFilter === 'all' ? undefined : contentTypeFilter,
          timeFilter: timeFilter
        };
        const res = await api.get("/movies/stats", { params });
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setStats(null); // Clear stats on error
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, [contentTypeFilter, timeFilter]); // Re-fetch when filters change

  // Define themes based on content type filter
  const theme = {
    all: {
      accent: "red",
      mainText: "text-red-400",
      secondaryText: "text-red-500",
      bg: "bg-red-500",
      border: "border-red-500",
      fill: "#ef4444", // Tailwind red-500
    },
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
    return <div className="text-white p-8 text-center">Loading dashboard...</div>;
  }

  // Default stats if fetching failed or no data
  const currentStats = stats || {
    totalItems: 0,
    completedCount: 0,
    totalHours: 0,
    avgRating: 0,
    highestRating: 0,
    lowestRating: 0,
    best: "N/A",
    worst: "N/A",
    favoriteGenre: "N/A",
    topRated: [],
    dailyActivity: [
      { day: "Mon", count: 0 }, { day: "Tue", count: 0 }, { day: "Wed", count: 0 },
      { day: "Thu", count: 0 }, { day: "Fri", count: 0 }, { day: "Sat", count: 0 }, { day: "Sun", count: 0 }
    ]
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Content Type Selector (All / Movies / TV Shows) */} 
        <div className="flex justify-center border-b border-gray-700 mb-6 sticky top-0 bg-gray-900 z-10 py-2">
          <TabButton title="All Content" isActive={contentTypeFilter === 'all'} onClick={() => setContentTypeFilter('all')} theme={theme.all} />
          <TabButton title="Movies" isActive={contentTypeFilter === 'movie'} onClick={() => setContentTypeFilter('movie')} theme={theme.movie} />
          <TabButton title="TV Series" isActive={contentTypeFilter === 'tv'} onClick={() => setContentTypeFilter('tv')} theme={theme.tv} />
        </div>

        {/* Time Filter Selector (Overall / This Year / This Month) */}
        <div className="flex justify-center space-x-2 md:space-x-4 mb-6">
          <StatsFilterButton title="Overall stats" isActive={timeFilter === 'overall'} onClick={() => setTimeFilter('overall')} theme={activeTheme} />
          <StatsFilterButton title="This year" isActive={timeFilter === 'year'} onClick={() => setTimeFilter('year')} theme={activeTheme} />
          <StatsFilterButton title="This month" isActive={timeFilter === 'month'} onClick={() => setTimeFilter('month')} theme={activeTheme} />
        </div>

        {/* --- Stats Section --- */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Column 1 */}
            <StatCard 
              icon={<ChartIcon />} 
              title="Watch Count" 
              value={currentStats.completedCount} 
              theme={activeTheme}
            />

            <StatCard 
              icon={<StarIcon />} 
              title="Avg. Rate" 
              value={currentStats.avgRating ? currentStats.avgRating.toFixed(1) : "0.0"} 
              theme={activeTheme}
            />

            <StatCard 
              title="Best Rated" 
              value={currentStats.best || "N/A"}
              theme={activeTheme} 
            />

            <StatCard 
              title="Best Rate" 
              value={currentStats.highestRating ? `${currentStats.highestRating}` : "N/A"}
              theme={activeTheme} 
            />

            {/* Column 2 */}
            <StatCard 
              title="Worst Rated" 
              value={currentStats.worst || "N/A"}
              theme={activeTheme}
            />

            <StatCard 
              title="Worst Rate" 
              value={currentStats.lowestRating ? `${currentStats.lowestRating}` : "N/A"} 
              theme={activeTheme}
            />

            <StatCard 
              icon={<GenreIcon />} 
              title="Favorite Genre" 
              value={currentStats.favoriteGenre || "N/A"} 
              theme={activeTheme}
            />

            <StatCard 
              icon={<ClockIcon />} 
              title="Watch Time" 
              value={formatWatchTime(currentStats.totalHours || 0)} 
              theme={activeTheme}
            />
          </div>
        </div>


        {/* --- Daily Activity Chart --- */}
        <div className="bg-gray-800 p-4 rounded-lg mb-8">
            <h3 className="text-xl font-bold mb-4">Your daily activity</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentStats.dailyActivity} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis type="category" dataKey="day" stroke="#9ca3af" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                    <Bar dataKey="count" barSize={20} radius={[0, 0, 0, 0]}>
                        {currentStats.dailyActivity.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={activeTheme.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* --- Top 5/10 List --- */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Your top {showAllTop ? 10 : 5}</h3>
            {currentStats.topRated && currentStats.topRated.length > 5 && (
              <button
                onClick={() => setShowAllTop(!showAllTop)}
                className="px-3 py-1 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 transition-colors duration-200 text-sm"
              >
                {showAllTop ? "Show Less" : "Show More"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(currentStats.topRated || []).slice(0, showAllTop ? 10 : 5).map((item, index) => (
              <div
                key={item._id || `${item.title}-${index}`}
                className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-400 font-bold w-8 text-center">{index + 1}</span>
                  <p className="truncate">{item.title}</p>
                </div>
                <span className={`font-bold text-lg px-3 py-1 rounded ${activeTheme.bg} text-gray-900`}>
                  {formatRating(item.rating)}
                </span>
              </div>
            ))}
            {(!currentStats.topRated || currentStats.topRated.length === 0) && (
              <p className="text-gray-400 text-center">No rated items available for this period.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components (unchanged from your previous version, included for completeness) ---
const TabButton = ({ title, isActive, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-lg font-semibold transition-colors duration-300 ${isActive ? `${theme.mainText} border-b-2 ${theme.border}` : 'text-gray-400 border-b-2 border-transparent hover:text-white'}`}
  >
    {title}
  </button>
);

const StatsFilterButton = ({ title, isActive, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-colors duration-300 ${isActive ? `${theme.bg} text-white` : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
  >
    {title}
  </button>
);

const StatCard = ({ icon, title, value, subValue, theme }) => ( // Add 'theme' prop here
  <div className="bg-gray-800 p-4 rounded-lg col-span-1 md:col-span-2 flex flex-col justify-between">
    <div className="flex items-start justify-between">
        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${theme ? theme.mainText : 'text-white'}`}>{value}</p> 
        </div>
        {icon && <div className="text-gray-500">{icon}</div>}
    </div>
    {subValue && <p className="text-gray-500 text-xs mt-2 truncate">{subValue}</p>}
  </div>
);

// --- Helper: format minutes into Xd Yh Zm ---
function formatWatchTime(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return "0m";
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return `${days > 0 ? days + "d " : ""}${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutes + "m" : ""}`.trim();
}

// Format rating like "10" or "9.8"
function formatRating(r) {
  if (r == null) return "N/A";
  const s = Number(r).toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

export default Dashboard;
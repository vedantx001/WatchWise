import { useEffect, useState } from "react";
import api from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";


function Dashboard() {
  const [stats, setStats] = useState(null);
  const [genreData, setGenreData] = useState([]);

  useEffect(() => {
    api.get("/movies/stats").then((res) => setStats(res.data));
    api.get("/movies").then((res) => {
      const genreMap = {};
      res.data.forEach((m) => {
        if (m.genre) genreMap[m.genre] = (genreMap[m.genre] || 0) + 1;
      });
      setGenreData(Object.entries(genreMap).map(([genre, count]) => ({ genre, count })));
    });
  }, []);

  if (!stats) return <div className="text-white p-8">Loading stats...</div>;

  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl mb-4">📊 Analytics</h2>
      <p>Total Movies: {stats.totalMovies}</p>
      <p>Completed Movies: {stats.completedCount}</p>
      <p>Total Watch Hours: {stats.totalHours} hrs</p>
      <p>Best Rated: ⭐ {stats.best}</p>
      <p>Worst Rated: 😬 {stats.worst}</p>

      {/* Genre Pie Chart */}
      <div className="my-8">
        <h3 className="mb-2">🎭 Genre Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={genreData} dataKey="count" nameKey="genre" outerRadius={100} label>
              {genreData.map((entry, index) => (
                <Cell key={index} fill={["#FF4C4C", "#4C9AFF", "#FFD93D", "#4CFF85"][index % 4]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;

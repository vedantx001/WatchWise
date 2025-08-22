import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import Watchlist from "./pages/Watchlist";
import Landing from "./pages/Landing";
import Layout from "./components/Layout";
import Trending from "./pages/TrendsTab";
import SearchResults from "./pages/SearchResults";
import ContentDetails from "./pages/ContentDetails";
import SeasonDetails from "./pages/SeasonDetails";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/search/:query" element={<SearchResults />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/details/:type/:id" element={<ContentDetails />} />
          <Route path="/details/:type/:id/season/:seasonNumber" element={<SeasonDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
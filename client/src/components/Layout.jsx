import { Outlet, Link } from "react-router-dom";

function Layout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 p-4 flex justify-between">
        <Link to="/" className="text-2xl font-bold text-red-500">WatchWise</Link>
        <nav className="flex gap-4">
          <Link to="/watchlist">Watchlist</Link>
          <Link to="/dashboard">Dashboard</Link>
          <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
            Logout
          </button>
        </nav>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
export default Layout;

import { Outlet, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 flex justify-between">
        
        <Navbar />
      </header>
      <main className="bg-[var(--color-background-primary)] dark:bg-[var(--color-background-primary)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]">
        <Outlet />
      </main>
    </div>
  );
}
export default Layout;

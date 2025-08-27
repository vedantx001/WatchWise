import { Outlet, Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout() {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith("/details");


  return (
    <div className="flex flex-col min-h-screen text-white">
      <header className="flex justify-between">
        <Navbar />
      </header>
      <main className="flex-1 bg-[var(--color-background-primary)] dark:bg-[var(--color-background-primary)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
export default Layout;

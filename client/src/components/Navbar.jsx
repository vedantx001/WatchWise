import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 p-4 flex justify-between">
      <h1 className="text-red-500 text-2xl">WatchWise</h1>
      <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700">
        Logout
      </button>
    </nav>
  );
}

export default Navbar;

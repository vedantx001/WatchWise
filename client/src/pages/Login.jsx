import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]); // State to hold validation errors
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors([]); // Clear previous errors on new submission

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });

      // If login is successful, the backend returns a token
      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token); // Store the JWT token
        alert("Login successful! Redirecting to Dashboard.");
        navigate("/dashboard"); // Redirect to your protected dashboard or desired page
        console.log("Login successful, token stored:", token);
      } else {
        // This case should ideally not happen if the backend always returns a token on success
        alert("Login successful, but no token received.");
        // Consider a more robust error handling or a re-login prompt here
      }

    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          // This array comes from express-validator errors for email/password existence
          setErrors(err.response.data.errors);
        } else if (err.response.data.msg) {
          // This is for "Invalid credentials" or other single messages
          setErrors([{ msg: err.response.data.msg }]);
        } else {
          // Generic error message
          setErrors([{ msg: "An unexpected error occurred during login." }]);
        }
      } else {
        // Network error or no response from server
        setErrors([{ msg: "Login failed. Please check your network connection." }]);
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-white mb-6">Login</h2>

        {/* Display validation errors here */}
        {errors.length > 0 && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {errors.map((error, index) => (
              <p key={index} className="text-sm">{error.msg}</p>
            ))}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 p-3 w-full rounded placeholder-white text-white caret-white bg-transparent border border-white focus:outline-none focus:ring-2 focus:ring-red-600"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 p-3 w-full rounded placeholder-white text-white caret-white bg-transparent border border-white focus:outline-none focus:ring-2 focus:ring-red-600"
          required
        />
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors duration-200"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
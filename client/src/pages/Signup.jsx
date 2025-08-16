import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]); // State to hold validation errors
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors([]); // Clear previous errors on new submission

    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        name,
        email,
        password,
      });

      // If signup is successful, the new backend returns a token
      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token); // Store the JWT token
        alert("Signup successful! Redirecting to Dashboard.");
        navigate("/dashboard"); // Redirect to a protected route after signup
        console.log("Signup successful, token stored:", token);
      } else {
        // This case should ideally not happen with the new backend logic
        alert("Signup successful, but no token received.");
        navigate("/login"); // Fallback to login if no token is returned unexpectedly
      }

    } catch (err) {
      console.error("Signup error:", err);
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          // This array comes from express-validator errors
          setErrors(err.response.data.errors);
        } else if (err.response.data.msg) {
          // This is for "User already exists" or other single messages
          setErrors([{ msg: err.response.data.msg }]);
        } else {
          // Generic error message
          setErrors([{ msg: "An unexpected error occurred during signup." }]);
        }
      } else {
        // Network error or no response from server
        setErrors([{ msg: "Signup failed. Please check your network connection." }]);
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <form onSubmit={handleSignup} className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-white mb-6">Sign Up</h2>

        {/* Display validation errors here */}
        {errors.length > 0 && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {errors.map((error, index) => (
              <p key={index} className="text-sm">{error.msg}</p>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="Name"
          className="mb-4 p-3 w-full rounded placeholder-white text-white caret-white bg-transparent border border-white focus:outline-none focus:ring-2 focus:ring-red-600"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="mb-4 p-3 w-full rounded placeholder-white text-white caret-white bg-transparent border border-white focus:outline-none focus:ring-2 focus:ring-red-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-6 p-3 w-full rounded placeholder-white text-white caret-white bg-transparent border border-white focus:outline-none focus:ring-2 focus:ring-red-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors duration-200"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default Signup;
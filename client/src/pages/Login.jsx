import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors([]);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
        alert("Login successful! Redirecting to Dashboard.");
        navigate("/dashboard");
        console.log("Login successful, token stored:", token);
      } else {
        alert("Login successful, but no token received.");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          setErrors(err.response.data.errors);
        } else if (err.response.data.msg) {
          setErrors([{ msg: err.response.data.msg }]);
        } else {
          setErrors([{ msg: "An unexpected error occurred during login." }]);
        }
      } else {
        setErrors([{ msg: "Login failed. Please check your network connection." }]);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSignupClick = () => {
    navigate("/signup");
  };

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-[#090A0B] overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      {/* Decorative elements (reduced on mobile) */}
      <div className="hidden sm:block absolute -top-40 -left-40 w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-red-500/10 rounded-full blur-2xl md:blur-3xl pointer-events-none" />
      <div className="hidden sm:block absolute -bottom-32 left-6 w-56 h-56 md:w-72 md:h-72 bg-red-600/8 rounded-full blur-xl md:blur-2xl pointer-events-none" />
      <div className="hidden md:block absolute top-1/3 -right-20 w-56 h-56 md:w-72 md:h-72 bg-red-400/12 rounded-full blur-2xl md:blur-3xl pointer-events-none" />
      <div className="hidden md:block absolute bottom-1/4 right-1/3 w-40 h-40 md:w-48 md:h-48 bg-red-500/6 rounded-full blur-lg md:blur-xl pointer-events-none" />

      {/* Subtle grid pattern overlay (hide on small for clarity/perf) */}
      <div className="hidden sm:block absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot; %3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23FF6B6B&quot; fill-opacity=&quot;0.03&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;1&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none" />

      <AnimatePresence>
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10 w-full max-w-[20rem] sm:max-w-[22rem] md:max-w-[26rem]"
        >
          {/* Main card */}
          <div className="bg-[#1F1F1F]/80 supports-[backdrop-filter]:backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8">
            {/* Logo & Brand */}
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/25 mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">W</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F8F8F2] tracking-tight">
                WatchWise
              </h1>
              <p className="text-[#BFBFBF] text-xs sm:text-sm mt-1.5 sm:mt-2 text-center">
                Welcome back to your entertainment hub
              </p>
            </div>

            {/* Error messages */}
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 sm:p-4 rounded-xl mb-5 sm:mb-6 backdrop-blur-sm"
                >
                  {errors.map((error, idx) => (
                    <p key={idx} className="text-sm font-medium leading-relaxed">
                      {error.msg}
                    </p>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
              {/* Email field */}
              <div className="relative group">
                <input
                  type="email"
                  id="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 pt-6 pb-2 bg-[#090A0B]/50 border border-white/10 rounded-xl text-base text-[#F8F8F2] placeholder-transparent focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 peer group-hover:border-white/20"
                  required
                  autoComplete="email"
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-2 text-[#BFBFBF] text-xs font-medium peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-red-400 transition-all duration-200 pointer-events-none"
                >
                  Email Address
                </label>
              </div>

              {/* Password field with eye icon */}
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 pt-6 pb-2 pr-12 bg-[#090A0B]/50 border border-white/10 rounded-xl text-base text-[#F8F8F2] placeholder-transparent focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 peer group-hover:border-white/20"
                  required
                  autoComplete="current-password"
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-2 text-[#BFBFBF] text-xs font-medium peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-red-400 transition-all duration-200 pointer-events-none"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFBFBF] hover:text-[#F8F8F2] transition-colors duration-200 p-1 cursor-pointer"
                >
                  {showPassword ? (
                    // Eye slash icon
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Login button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-sm sm:text-base shadow-lg shadow-red-500/25 hover:shadow-red-500/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-0 sm:focus:ring-offset-[#1F1F1F] transition-all duration-200 relative overflow-hidden group cursor-pointer"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/5">
              <p className="text-center text-[#BFBFBF] text-sm">
                Don't have an account?{" "}
                <button
                  onClick={handleSignupClick}
                  className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200 hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>

          {/* Subtle glow effect (show on larger screens) */}
          <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 rounded-2xl blur-xl -z-10" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default Login;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Basic email pattern check
  const isValidEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!email.trim()) {
      return toast.error("Email is required");
    }
    if (!isValidEmail(email)) {
      return toast.error("Please enter a valid email address");
    }
    if (!password) {
      return toast.error("Password is required");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsSubmitting(true);
    const loginToast = toast.loading("Authenticating...");

    try {
      await login(email, password);
      toast.success("Welcome back to ProvenStack!", { id: loginToast });
      navigate("/dashboard");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.data?.message || "Invalid credentials. Please try again.";
      toast.error(errMsg, { id: loginToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleOAuth = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    window.location.href = `${baseUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0c0c0e] relative overflow-hidden font-sans">
      {/* Neon Purple/Indigo Orb Backdrops */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Clean Navbar */}
      <header className="px-8 py-5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-display font-extrabold text-sm shadow-md shadow-violet-600/20">
            P
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            ProvenStack <span className="text-gradient">Hub</span>
          </span>
        </div>
      </header>

      {/* Main card viewport */}
      <main className="flex-1 flex justify-center items-center px-4 py-8 z-10 shrink-0">
        <div className="w-full max-w-md glass-card p-8 sm:p-10 border border-[#232329] bg-[#141417]/85 backdrop-blur-md shadow-2xl transition-all duration-300">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-text-muted font-medium">
              Log in to sync with your hackathon teammates and projects
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                  ✉️
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] text-sm text-white placeholder-text-muted/40 shadow-inner outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                  🔒
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] text-sm text-white placeholder-text-muted/40 shadow-inner outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium"
                  placeholder="••••••••"
                />
                
                {/* Hide / Show Toggle Icon Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[10px] font-bold text-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-6 shadow-lg shadow-violet-500/10"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <span className="text-xs">➜</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-[#232329]"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold uppercase tracking-widest text-text-muted/50 select-none">
              or continue with
            </span>
            <div className="flex-grow border-t border-[#232329]"></div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleOAuth}
            className="w-full btn-secondary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            {/* Flat Google Icon */}
            <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.77 14.93 1 12 1 7.35 1 3.39 3.67 1.49 7.57l3.77 2.92C6.15 7.15 8.87 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.45 12.3c0-.82-.07-1.6-.2-2.3H12v4.35h6.42c-.28 1.47-1.1 2.72-2.35 3.56l3.65 2.83c2.13-1.97 3.73-4.87 3.73-8.44z"
              />
              <path
                fill="#FBBC05"
                d="M5.26 14.51c-.24-.72-.38-1.5-.38-2.3 0-.8.14-1.58.38-2.3L1.49 7.02C.54 8.92 0 11.04 0 13.3c0 2.26.54 4.38 1.49 6.28l3.77-2.92c-.24-.71-.38-1.49-.38-2.15z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.65-2.83c-1.01.68-2.3.1-4.31.1-3.13 0-5.85-2.11-6.74-5.46L1.49 14.8C3.39 19.33 7.35 23 12 23z"
              />
            </svg>
            <span>Google Account</span>
          </button>

          {/* Footer Link */}
          <p className="text-center text-xs text-text-muted mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline transition-colors font-sans"
            >
              Create an Account
            </Link>
          </p>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-text-muted z-10 shrink-0 select-none">
        <p>© 2026 ProvenStack Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;

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
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-4 py-12 text-[#f1f5f9] font-sans">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a] p-8 shadow-2xl transition-all duration-300 hover:border-indigo-500/30">
        
        {/* Header Logo & Subtitle */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-xl font-bold shadow-lg shadow-indigo-500/20 text-white">
            P
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Sign in to ProvenStack
          </h2>
          <p className="text-xs text-[#94a3b8]">
            Your central hub for hackathon collaborations
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-[#2e2e2e] bg-[#242424] px-3.5 py-2.5 text-sm text-white placeholder-[#94a3b8]/40 shadow-inner outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                  Password
                </label>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-[#2e2e2e] bg-[#242424] px-3.5 pr-10 py-2.5 text-sm text-white placeholder-[#94a3b8]/40 shadow-inner outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                
                {/* Hide / Show Toggle Icon Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#94a3b8] hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <span className="text-xs font-semibold tracking-wide uppercase select-none">Hide</span>
                  ) : (
                    <span className="text-xs font-semibold tracking-wide uppercase select-none">Show</span>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#2e2e2e]"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]/50">
            or continue with
          </span>
          <div className="flex-grow border-t border-[#2e2e2e]"></div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleOAuth}
          className="flex w-full items-center justify-center space-x-2.5 rounded-lg border border-[#2e2e2e] bg-[#242424] px-4 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#2d2d2d] active:scale-[0.98]"
        >
          {/* Flat Google Icon */}
          <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          <span className="font-semibold">Google Account</span>
        </button>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#94a3b8]">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;

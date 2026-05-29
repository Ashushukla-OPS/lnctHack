import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [github, setGithub] = useState("");
  const [leetcode, setLeetcode] = useState("");
  const [codeforces, setCodeforces] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Basic email pattern check
  const isValidEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!name.trim()) {
      return toast.error("Full Name is required");
    }
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
    if (!location.trim()) {
      return toast.error("Location / City is required");
    }

    setIsSubmitting(true);
    const registerToast = toast.loading("Creating your squad profile...");

    try {
      await register(
        name.trim(),
        email.trim(),
        password,
        location.trim(),
        github.trim(),
        leetcode.trim(),
        codeforces.trim()
      );
      toast.success("Account created successfully! Please log in.", { id: registerToast });
      navigate("/login");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.data?.message || "Registration failed. Please check your inputs.";
      toast.error(errMsg, { id: registerToast });
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="w-full max-w-2xl glass-card p-8 sm:p-10 border border-[#232329] bg-[#141417]/85 backdrop-blur-md shadow-2xl transition-all duration-300">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
              Create your Account
            </h2>
            <p className="text-xs text-text-muted font-medium">
              Join ProvenStack to form high-chemistry hackathon projects
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Core Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-xs select-none">
                    👤
                  </span>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] text-sm text-white placeholder-text-muted/40 shadow-inner outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-xs select-none">
                    ✉️
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] text-sm text-white placeholder-text-muted/40 shadow-inner outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Password <span className="text-red-500">*</span> (min 6)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-xs select-none">
                    🔒
                  </span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] text-sm text-white placeholder-text-muted/40 shadow-inner outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label htmlFor="location" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Location / City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-xs select-none">
                    📍
                  </span>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] text-sm text-white placeholder-text-muted/40 shadow-inner outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium"
                    placeholder="Bangalore, Karnataka"
                  />
                </div>
              </div>
            </div>

            {/* Developer handles */}
            <div className="border-t border-[#232329] pt-4 space-y-4">
              <h3 className="text-xs font-semibold text-primary tracking-wide">Developer Handles & Platform Sync</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* GitHub */}
                <div className="space-y-1.5">
                  <label htmlFor="github" className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">
                    GitHub Username
                  </label>
                  <input
                    id="github"
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232329] bg-[#16161a] text-xs text-white placeholder-text-muted/40 outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium"
                    placeholder="github-username"
                  />
                </div>

                {/* LeetCode */}
                <div className="space-y-1.5">
                  <label htmlFor="leetcode" className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">
                    LeetCode Handle
                  </label>
                  <input
                    id="leetcode"
                    type="text"
                    value={leetcode}
                    onChange={(e) => setLeetcode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232329] bg-[#16161a] text-xs text-white placeholder-text-muted/40 outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium"
                    placeholder="leetcode-handle"
                  />
                </div>

                {/* Codeforces */}
                <div className="space-y-1.5">
                  <label htmlFor="codeforces" className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">
                    Codeforces Handle
                  </label>
                  <input
                    id="codeforces"
                    type="text"
                    value={codeforces}
                    onChange={(e) => setCodeforces(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232329] bg-[#16161a] text-xs text-white placeholder-text-muted/40 outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium"
                    placeholder="cf-handle"
                  />
                </div>

              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-6 shadow-lg shadow-violet-500/10"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="text-xs">➜</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-xs text-text-muted mt-6 pt-4 border-t border-[#232329]/50">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline transition-colors font-sans"
            >
              Login Here
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

export default Register;

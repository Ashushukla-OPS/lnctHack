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
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-4 py-8 text-[#f1f5f9] font-sans">
      <div className="w-full max-w-xl space-y-6 rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a] p-8 shadow-2xl transition-all duration-300 hover:border-indigo-500/30">
        
        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg">
            P
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Create your ProvenStack Account</h2>
          <p className="text-xs text-[#94a3b8]">Join team forming hackathons in India & globally</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Section: Core Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#2e2e2e] bg-[#242424] px-3 py-2 text-sm text-white placeholder-[#94a3b8]/30 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#2e2e2e] bg-[#242424] px-3 py-2 text-sm text-white placeholder-[#94a3b8]/30 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="john@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                Password <span className="text-red-500">*</span> (min 6)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#2e2e2e] bg-[#242424] px-3 py-2 text-sm text-white placeholder-[#94a3b8]/30 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {/* Location / City */}
            <div>
              <label htmlFor="location" className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                Location / City <span className="text-red-500">*</span>
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#2e2e2e] bg-[#242424] px-3 py-2 text-sm text-white placeholder-[#94a3b8]/30 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Bangalore, Karnataka"
              />
            </div>

          </div>

          {/* Section: Tech Platform Handles (Optional) */}
          <div className="border-t border-[#2e2e2e] pt-4">
            <h3 className="text-xs font-semibold text-indigo-400 mb-3 tracking-wide">Tech Platforms & Developer Handles</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* GitHub Handle */}
              <div>
                <label htmlFor="github" className="block text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  GitHub Username
                </label>
                <input
                  id="github"
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#2e2e2e] bg-[#242424] px-3 py-2 text-sm text-white placeholder-[#94a3b8]/30 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="github-profile"
                />
              </div>

              {/* LeetCode Handle */}
              <div>
                <label htmlFor="leetcode" className="block text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  LeetCode Handle
                </label>
                <input
                  id="leetcode"
                  type="text"
                  value={leetcode}
                  onChange={(e) => setLeetcode(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#2e2e2e] bg-[#242424] px-3 py-2 text-sm text-white placeholder-[#94a3b8]/30 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="leetcode-profile"
                />
              </div>

              {/* Codeforces Handle */}
              <div>
                <label htmlFor="codeforces" className="block text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Codeforces Handle
                </label>
                <input
                  id="codeforces"
                  type="text"
                  value={codeforces}
                  onChange={(e) => setCodeforces(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#2e2e2e] bg-[#242424] px-3 py-2 text-sm text-white placeholder-[#94a3b8]/30 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="cf-profile"
                />
              </div>

            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              "Create Account"
            )}
          </button>

        </form>

        {/* Footer Navigation */}
        <p className="text-center text-xs text-[#94a3b8] pt-2 border-t border-[#2e2e2e]/50">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;

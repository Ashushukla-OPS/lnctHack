import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Fetch the currently logged-in user profile to restore session
  const getMe = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/users/me");
      const userData = response.data?.data || response.data;
      setUser(userData);
      setIsLoggedIn(true);
      return userData;
    } catch (error) {
      console.error("Session restoration failed:", error);
      setUser(null);
      setToken(null);
      setIsLoggedIn(false);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  // Login a user
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/login", { email, password });
      
      // Access token might be inside response.data.token or response.data.data.token
      // (Backend registers accessToken in cookies, but also returns user info)
      const userData = response.data?.data || response.data;
      const responseToken = response.data?.token || response.data?.data?.token || "dummy-token-cookie-managed";

      localStorage.setItem("token", responseToken);
      setToken(responseToken);
      setUser(userData);
      setIsLoggedIn(true);
      
      // Sync user data by calling getMe
      await getMe();
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register a new user
  const register = async (name, email, password, location, github, leetcode, codeforces) => {
    setLoading(true);
    try {
      await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
        location,
        github,
        leetcode,
        codeforces,
      });
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout current user
  const logout = async () => {
    try {
      // Backend does not explicitly declare a logout route, but we trigger it in case
      await axiosInstance.post("/auth/logout").catch(() => {});
    } catch (e) {
      // Ignore errors
    } finally {
      localStorage.clear();
      setUser(null);
      setToken(null);
      setIsLoggedIn(false);
      window.location.href = "/login";
    }
  };

  // Run on initial app mount to recover session
  useEffect(() => {
    const activeToken = localStorage.getItem("token");
    if (activeToken) {
      getMe();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        loading,
        login,
        register,
        logout,
        getMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

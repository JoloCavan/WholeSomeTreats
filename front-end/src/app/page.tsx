"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPhoneNumber, setRegPhoneNumber] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password form state
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-dismiss error toast after 2 seconds (2000ms)
  useEffect(() => {
    if (toast?.type === "error") {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setToast({
        type: "error",
        message: "login failed",
      });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: username,
          Password: password,
          username: username,
          password: password,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.token) localStorage.setItem("token", data.token);
        if (data?.role) localStorage.setItem("userRole", data.role);
        if (data?.roleId) localStorage.setItem("roleId", String(data.roleId));
        if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
        else localStorage.setItem("user", JSON.stringify({ username, role: data?.role || "customer", roleId: data?.roleId || 2 }));

        const userRole = (data?.role || data?.user?.role || "").toLowerCase();
        if (userRole === "admin" || data?.roleId === 1) {
          localStorage.setItem("wt_active_tab", "orders");
        } else {
          localStorage.setItem("wt_active_tab", "products");
        }

        setToast({
          type: "success",
          message: data?.message || "Login successful!",
        });

        // Navigate straight to /dashboard for all users
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setToast({
          type: "error",
          message: errorData?.message || "login failed",
        });
      }
    } catch (err) {
      console.error("Login API request error:", err);
      setToast({
        type: "error",
        message: "login failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to calculate password strength
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: "Very Weak", color: "bg-stone-200", textColor: "text-stone-400" };
    const hasLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);

    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-rose-500", textColor: "text-rose-600" };
    if (score <= 4) return { score, label: "Medium", color: "bg-amber-500", textColor: "text-amber-600" };
    return { score, label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-600" };
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const targetUsername = mode === "register" ? regUsername : username;
    const targetPassword = mode === "register" ? regPassword : password;

    if (!targetUsername.trim() || !targetPassword.trim()) {
      setToast({
        type: "error",
        message: "Please fill in required registration details.",
      });
      return;
    }

    if (mode === "register") {
      const hasLength = targetPassword.length >= 8;
      const hasUpper = /[A-Z]/.test(targetPassword);
      const hasLower = /[a-z]/.test(targetPassword);
      const hasDigit = /[0-9]/.test(targetPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(targetPassword);

      if (!hasLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        setToast({
          type: "error",
          message: "Password must be at least 8 characters with uppercase, lowercase, number & special symbol.",
        });
        return;
      }

      const phoneDigits = regPhoneNumber.trim();
      const isDummyRepetitive = phoneDigits === "09000000000" || phoneDigits === "09111111111" || phoneDigits === "09999999999" || phoneDigits === "09123456789";
      if (!phoneDigits || !/^09\d{9}$/.test(phoneDigits) || isDummyRepetitive) {
        setToast({
          type: "error",
          message: "Please enter a valid 11-digit Philippine mobile number starting with 09 (e.g. 09171234567).",
        });
        return;
      }
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: targetUsername,
          FullName: regFullName || targetUsername,
          PhoneNumber: regPhoneNumber.trim(),
          Address: regAddress || "Default Address",
          Password: targetPassword,
          username: targetUsername,
          fullName: regFullName || targetUsername,
          phoneNumber: regPhoneNumber.trim(),
          address: regAddress || "Default Address",
          password: targetPassword,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setToast({
          type: "success",
          message: data?.message || "User registered successfully.",
        });
        // Switch back to login mode on success
        setTimeout(() => setMode("login"), 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setToast({
          type: "error",
          message: errorData?.message || "This username already exists.",
        });
      }
    } catch (err) {
      console.error("Registration API error:", err);
      setToast({
        type: "error",
        message: "Registration failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterClick = () => {
    if (username || password) {
      setRegUsername(username);
      setRegPassword(password);
    }
    setMode("register");
  };

  // Handle Forgot Password submission
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotUsername.trim() || !forgotNewPassword.trim() || !forgotConfirmPassword.trim()) {
      setToast({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setToast({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    const hasLength = forgotNewPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(forgotNewPassword);
    const hasLower = /[a-z]/.test(forgotNewPassword);
    const hasDigit = /[0-9]/.test(forgotNewPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(forgotNewPassword);

    if (!hasLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setToast({
        type: "error",
        message: "Password must be at least 8 characters with uppercase, lowercase, number & special symbol.",
      });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: forgotUsername,
          NewPassword: forgotNewPassword,
          username: forgotUsername,
          newPassword: forgotNewPassword,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setToast({
          type: "success",
          message: data?.message || "Password reset successfully!",
        });
        setTimeout(() => {
          setMode("login");
          setForgotUsername("");
          setForgotNewPassword("");
          setForgotConfirmPassword("");
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setToast({
          type: "error",
          message: errorData?.message || "Password reset failed.",
        });
      }
    } catch (err) {
      console.error("Forgot password API error:", err);
      setToast({
        type: "error",
        message: "Password reset failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-stone-900 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce duration-300">
          <div
            id="toast-notification"
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-semibold transition-all ${
              toast.type === "success"
                ? "bg-emerald-900 text-emerald-100 border-emerald-500/40 shadow-emerald-900/30"
                : "bg-rose-900 text-rose-100 border-rose-500/40 shadow-rose-900/30"
            }`}
          >
            <span className="text-base">
              {toast.type === "success" ? "🎉" : "❌"}
            </span>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Warm Peach & Orange Background Accent Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-orange-300/30 via-amber-200/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-300/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-300/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full border-b border-orange-200/60 bg-[#FDF8F3]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* W Logo matching Wholesome Treats orange brand color */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/40">
              W
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-stone-900 tracking-tight text-xl leading-none">
                Wholesome<span className="text-orange-600">Treats</span>
              </span>
              <span className="text-[10px] font-semibold text-orange-600/80 italic tracking-wider">
                Delight in Every Bite
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-white/95 text-stone-900 border border-orange-200/90 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl shadow-orange-950/10 relative">
          {/* Top Line Warm Accent */}
          <div className="absolute top-0 left-8 right-8 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-90 rounded-full" />

          {/* Mode Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center mx-auto mb-4 text-orange-600 text-xl shadow-inner">
              {mode === "login" ? "🔒" : mode === "register" ? "📝" : "🔑"}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-stone-900 mb-1">
              {mode === "login"
                ? "Sign In to WholesomeTreats"
                : mode === "register"
                ? "Create an Account"
                : "Reset Your Password"}
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              {mode === "login"
                ? "Enter your credentials to access your account"
                : mode === "register"
                ? "Fill in the details below to register"
                : "Enter your username and choose a new password"}
            </p>
          </div>

          {/* LOGIN FORM VIEW */}
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2 text-left">
                <label
                  htmlFor="TxtUsername"
                  className="block text-xs font-bold text-stone-700 tracking-wide"
                >
                  Username
                </label>
                <div className="relative">
                  <input
                    id="TxtUsername"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 font-medium"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-orange-400 text-sm pointer-events-none">
                    👤
                  </span>
                </div>
              </div>

              {/* Password Field with Eye Toggle */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="TxtPassword"
                    className="block text-xs font-bold text-stone-700 tracking-wide"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotUsername(username);
                      setMode("forgot");
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700 font-bold transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="TxtPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-600 p-1 rounded-md transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label
                  htmlFor="ChkRememberMe"
                  className="flex items-center gap-2.5 text-xs text-stone-600 font-medium cursor-pointer select-none"
                >
                  <input
                    id="ChkRememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-white border-stone-300 text-orange-600 focus:ring-orange-500 focus:ring-offset-white cursor-pointer"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Log In Button */}
              <button
                id="BtnLogln"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm transition-all duration-200 shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>

              {/* Register Link Prompt below Log In */}
              <p className="text-center text-xs text-stone-600 font-medium mt-6">
                Don&apos;t have an account?{" "}
                <button
                  id="BtnRegisterLink"
                  type="button"
                  onClick={handleRegisterClick}
                  className="text-orange-600 hover:text-orange-700 font-black underline cursor-pointer transition-colors"
                >
                  register here
                </button>
              </p>
            </form>
          ) : mode === "register" ? (
            /* REGISTER FORM VIEW */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-stone-700">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-stone-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700">
                      Phone Number *
                    </label>
                    <span className={`text-[10px] font-semibold ${regPhoneNumber.length === 11 ? "text-emerald-600" : "text-amber-600"}`}>
                      {regPhoneNumber.length}/11
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={regPhoneNumber}
                    onChange={(e) => {
                      const cleanDigits = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setRegPhoneNumber(cleanDigits);
                    }}
                    placeholder="e.g. 09123456789"
                    className="w-full pl-3 pr-3 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Address
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="e.g. City, Country"
                    className="w-full pl-3 pr-3 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-stone-700">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 8 characters (Strong Password)"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-600 p-1"
                  >
                    {showRegPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>

                {/* Password Strength Meter & Live Checklist */}
                {regPassword.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-stone-500">Password Strength:</span>
                      <span className={getPasswordStrength(regPassword).textColor}>
                        {getPasswordStrength(regPassword).label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(regPassword).score >= 1 ? getPasswordStrength(regPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(regPassword).score >= 2 ? getPasswordStrength(regPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(regPassword).score >= 3 ? getPasswordStrength(regPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(regPassword).score >= 4 ? getPasswordStrength(regPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(regPassword).score >= 5 ? getPasswordStrength(regPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-stone-500 font-medium pt-1">
                      <span className={regPassword.length >= 8 ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {regPassword.length >= 8 ? "✓" : "○"} 8+ Characters
                      </span>
                      <span className={/[A-Z]/.test(regPassword) ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {/[A-Z]/.test(regPassword) ? "✓" : "○"} Uppercase (A-Z)
                      </span>
                      <span className={/[a-z]/.test(regPassword) ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {/[a-z]/.test(regPassword) ? "✓" : "○"} Lowercase (a-z)
                      </span>
                      <span className={/[0-9]/.test(regPassword) ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {/[0-9]/.test(regPassword) ? "✓" : "○"} Number (0-9)
                      </span>
                      <span className={/[^A-Za-z0-9]/.test(regPassword) ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {/[^A-Za-z0-9]/.test(regPassword) ? "✓" : "○"} Special (!@#$)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                id="BtnRegisterSubmit"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm transition-all duration-200 shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 disabled:opacity-60 mt-4 cursor-pointer"
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>

              <p className="text-center text-xs text-stone-600 font-medium mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
                >
                  Log in here
                </button>
              </p>
            </form>
          ) : (
            /* FORGOT PASSWORD FORM VIEW */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-stone-700">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  placeholder="Enter your registered username"
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-stone-700">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showForgotNewPassword ? "text" : "password"}
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-600 p-1"
                  >
                    {showForgotNewPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>

                {/* Password Strength Meter & Live Checklist */}
                {forgotNewPassword.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-stone-500">Password Strength:</span>
                      <span className={getPasswordStrength(forgotNewPassword).textColor}>
                        {getPasswordStrength(forgotNewPassword).label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(forgotNewPassword).score >= 1 ? getPasswordStrength(forgotNewPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(forgotNewPassword).score >= 2 ? getPasswordStrength(forgotNewPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(forgotNewPassword).score >= 3 ? getPasswordStrength(forgotNewPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(forgotNewPassword).score >= 4 ? getPasswordStrength(forgotNewPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(forgotNewPassword).score >= 5 ? getPasswordStrength(forgotNewPassword).color : 'bg-transparent'}`} style={{ width: '20%' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-stone-500 font-medium pt-1">
                      <span className={forgotNewPassword.length >= 8 ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {forgotNewPassword.length >= 8 ? "✓" : "○"} 8+ Characters
                      </span>
                      <span className={/[A-Z]/.test(forgotNewPassword) ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {/[A-Z]/.test(forgotNewPassword) ? "✓" : "○"} Uppercase (A-Z)
                      </span>
                      <span className={/[a-z]/.test(forgotNewPassword) ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {/[a-z]/.test(forgotNewPassword) ? "✓" : "○"} Lowercase (a-z)
                      </span>
                      <span className={/[0-9]/.test(forgotNewPassword) ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {/[0-9]/.test(forgotNewPassword) ? "✓" : "○"} Number (0-9)
                      </span>
                      <span className={/[^A-Za-z0-9]/.test(forgotNewPassword) ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {/[^A-Za-z0-9]/.test(forgotNewPassword) ? "✓" : "○"} Special (!@#$)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-stone-700">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                />
              </div>

              <button
                id="BtnForgotSubmit"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm transition-all duration-200 shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 disabled:opacity-60 mt-4 cursor-pointer"
              >
                {isSubmitting ? "Resetting Password..." : "Reset Password"}
              </button>

              <p className="text-center text-xs text-stone-600 font-medium mt-4">
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
                >
                  Log in here
                </button>
              </p>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-orange-200/60 bg-[#FDF8F3]/90 py-4 text-center text-xs text-stone-600 relative z-10 font-semibold">
        <p>WholesomeTreats • Delight in Every Bite</p>
      </footer>
    </div>
  );
}

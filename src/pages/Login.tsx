import React, { useState } from "react";
import { Member, Role } from "../types/types";
import {
  Music,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  User,
  Check,
} from "lucide-react";
import { auth } from "../utils/auth";

interface LoginProps {
  onLogin: (member: Member) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isForgotPassword) {
        if (!email) {
          setError("Please enter your email address.");
          setIsLoading(false);
          return;
        }
        await auth.sendPasswordResetEmail(email);
        setSuccessMessage("Password reset link sent! Please check your inbox.");
        setIsLoading(false);
        return;
      }

      if (isSignUp) {
        if (!name.trim()) {
          setError("Please enter your full name.");
          setIsLoading(false);
          return;
        }
        // Pass extra data to auth handler
        await auth.signUpWithEmailAndPassword(
          email,
          password,
          name,
          selectedRoles
        );
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }
      // Success is handled by the onAuthStateChanged listener in App.tsx
    } catch (err: any) {
      console.error("Auth Error:", err);
      const errorCode = err.code;
      const errorMessage = err.message || "";

      if (errorCode === "auth/email-already-in-use") {
        setError("Email already in use. Please sign in.");
      } else if (
        errorCode === "auth/invalid-credential" ||
        errorCode === "auth/user-not-found" ||
        errorCode === "auth/wrong-password" ||
        errorMessage.includes("auth/invalid-credential")
      ) {
        setError("Invalid email or password.");
      } else if (errorCode === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (errorCode === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else if (errorCode === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        // Fallback for other errors, avoiding raw code display if possible, or cleaning it up
        setError(
          "Authentication failed. Please check your details and try again."
        );
      }
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setError("");
    setSuccessMessage("");
    // Reset signup specific fields
    setName("");
    setSelectedRoles([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-black p-3 rounded-xl shadow-lg transform transition-transform hover:scale-105">
            <Music className="text-white h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {isForgotPassword
            ? "Reset Password"
            : isSignUp
            ? "Join the Team"
            : "Welcome Back"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">LSMIsystem</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <Check size={16} className="flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {isSignUp && !isForgotPassword && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    required
                    className="focus:ring-slate-500 focus:border-slate-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="focus:ring-slate-500 focus:border-slate-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2"
                  placeholder="you@church.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    required
                    className="focus:ring-slate-500 focus:border-slate-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {isSignUp && !isForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What do you play?{" "}
                  <span className="text-slate-400 font-normal">
                    (Select all that apply)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                  {Object.values(Role).map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <div
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all text-xs font-medium
                                        ${
                                          isSelected
                                            ? "bg-slate-100 border-slate-500 text-slate-900"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "bg-black border-black"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <Check size={8} className="text-white" />
                          )}
                        </div>
                        {role}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isSignUp && !isForgotPassword && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs font-medium text-slate-600 hover:text-black"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white 
                  ${
                    isLoading
                      ? "bg-slate-400 cursor-wait"
                      : "bg-black hover:bg-slate-800"
                  } 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    {isForgotPassword
                      ? "Send Reset Link"
                      : isSignUp
                      ? "Create Account"
                      : "Sign In"}
                    {!isForgotPassword && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  {isForgotPassword
                    ? "Remembered your password?"
                    : isSignUp
                    ? "Already have an account?"
                    : "New here?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              {isForgotPassword ? (
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError("");
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back to Login
                </button>
              ) : (
                <button
                  onClick={toggleMode}
                  className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  {isSignUp ? "Sign In instead" : "Create an Account"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

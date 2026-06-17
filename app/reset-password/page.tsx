"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { notify, messages } from "@/lib/notifications";
import { LoaderCircle, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

const ResetPassword = () => {
  const { updateAppPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Touch states for validation
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [isConfirmTouched, setIsConfirmTouched] = useState(false);

  const router = useRouter();

  // Validation Logic
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword;
  
  const showPasswordError = isPasswordTouched && !isPasswordValid && password.length > 0;
  const showMatchError = isConfirmTouched && !doPasswordsMatch && confirmPassword.length > 0;
  
  const isFormValid = isPasswordValid && doPasswordsMatch && password.length > 0 && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      return;
    }

    setLoading(true);
    try {
      await updateAppPassword(password);
      notify.success(messages.auth.passwordUpdated);
      router.push("/");
    } catch (error: any) {
      console.error(error);
      notify.fromError(error, messages.auth.passwordFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md p-6 border border-primary rounded-lg shadow-xl flex flex-col bg-card">
        <div className="flex items-center gap-2 mb-4">
          <LockKeyhole className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold text-primary">Reset Password</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                className={`px-3 py-2 border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10 ${showPasswordError ? "border-red-500 ring-red-500 focus:ring-red-500" : "border-border"}`}
                required
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!isPasswordTouched) setIsPasswordTouched(true);
                }}
                value={password}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {showPasswordError && (
              <span className="text-xs text-red-500">Password must be at least 8 characters long</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                className={`px-3 py-2 border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10 ${showMatchError ? "border-red-500 ring-red-500 focus:ring-red-500" : "border-border"}`}
                required
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (!isConfirmTouched) setIsConfirmTouched(true);
                }}
                value={confirmPassword}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {showMatchError && (
              <span className="text-xs text-red-500">Passwords do not match</span>
            )}
          </div>

          <div className="flex flex-col mt-4">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold shadow hover:bg-primary/90 transition cursor-pointer flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Password{" "}
              <LoaderCircle
                className={`${loading ? "block animate-spin" : "hidden"}`}
                size={16}
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

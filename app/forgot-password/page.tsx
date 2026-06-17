"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { notify, messages } from "@/lib/notifications";
import { LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      notify.success(messages.auth.resetEmailSent);
    } catch (error: any) {
      notify.fromError(error, messages.auth.resetEmailFailed);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md p-6 border border-primary rounded-lg shadow-xl bg-card text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-primary mb-2">Check your email</h3>
          <p className="text-muted-foreground mb-6">
            We have sent a password reset link to <strong>{email}</strong>.
          </p>
          <Link
            href="/login"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold shadow hover:bg-primary/90 transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md p-6 border border-primary rounded-lg shadow-xl flex flex-col bg-card">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold text-primary">Forgot Password</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="px-3 py-2 border border-border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
          <div className="flex flex-col mt-4 gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold shadow hover:bg-primary/90 transition cursor-pointer flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Send Reset Link{" "}
              <LoaderCircle
                className={`${loading ? "block animate-spin" : "hidden"}`}
                size={16}
              />
            </button>
            <Link
              href="/login"
              className="px-4 py-2 text-center text-sm text-muted-foreground hover:text-foreground transition"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

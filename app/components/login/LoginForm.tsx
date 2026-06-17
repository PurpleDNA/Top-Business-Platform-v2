/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { LogIn } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { useRouter } from "next/navigation";
import { notify, messages } from "@/lib/notifications";
import { LoaderCircle } from "lucide-react";

const LoginForm = ({ user }: { user: any }) => {
  const {
    // signInWithGoogle,
    // loading: googleLoading,
    signInWithEmail,
  } = useAuth();

  const [payload, setPayload] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleForgot = () => {
    router.push("/forgot-password");
  };

  // const handleGoogle = async () => {
  //   try {
  //     await signInWithGoogle();
  //   } catch (error) {
  //     console.error("Error logging in with Google:", error);
  //   } finally {
  //     console.log("google login");
  //   }
  // };

  useEffect(() => {
    // if (user && !googleLoading) {
    if (user) {
      router.push("/");
    }
    // }, [user, googleLoading, router]);
  }, [user, router]);

  const signIn = async () => {
    setLoading(true);
    const email = payload.email;
    const password = payload.password;
    try {
      await signInWithEmail({ email, password });
      notify.success(messages.auth.loginSuccess);
      router.push("/");
    } catch (error) {
      console.log(error);
      notify.fromError(error, messages.auth.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:w-96 p-6 border border-border/50 rounded-lg shadow-xl flex flex-col bg-card/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2 mb-8">
        <h3 className="text-2xl font-bold text-foreground">Login to Admin</h3>
      </div>

      {/* <button
        type="button"
        onClick={handleGoogle}
        className="flex items-center justify-center gap-3 mb-4 px-4 py-2 rounded-md border border-border shadow-sm hover:shadow-md transition-shadow bg-muted hover:bg-accent cursor-pointer"
      >
        <svg
          className={`h-5 w-5 ${googleLoading ? "animate-spin" : ""}`}
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.9 0 7.1 1.4 9.3 3.2l6.9-6.8C35 2.9 30.8 1 24 1 14.7 1 6.9 6.3 3 14.5l7.8 6.1C12.8 13 17.9 9.5 24 9.5z"
          />
          <path
            fill="#34A853"
            d="M46.5 24.5c0-1.6-.1-2.9-.4-4.2H24v8h12.9c-.6 3-2.5 5.6-5.3 7.3l8 6.1c4.6-4.2 7.9-10.5 7.9-17.2z"
          />
          <path
            fill="#4A90E2"
            d="M10.8 29.9c-.9-2.7-1.4-5.6-1.4-8.9s.5-6.2 1.4-8.9L3 6.1C.9 9.6 0 13.7 0 18c0 4.4.9 8.5 3 12l7.8-6.1z"
          />
          <path
            fill="#FBBC05"
            d="M24 46c6.8 0 12.6-2.2 16.8-6l-8-6.1c-2.3 1.5-5.3 2.5-8.8 2.5-6.1 0-11.2-3.5-13.9-8.6L3 36c3.9 8.2 11.7 13.5 21 13.5z"
          />
        </svg>
        <span className="text-sm font-medium text-foreground">
          Continue with Google
        </span>
      </button>

      <div className="flex items-center my-3">
        <div className="flex-1 h-px bg-border" />
        <span className="px-3 text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div> */}

      <form className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="px-3 py-2 border border-border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
          onChange={(e) =>
            setPayload((prev) => ({ ...prev, email: e.target.value }))
          }
          value={payload.email}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="px-3 py-2 border border-border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
          value={payload.password}
          onChange={(e) =>
            setPayload((prev) => ({ ...prev, password: e.target.value }))
          }
        />
      </form>
      <div className="flex flex-col mt-4">
        <button
          onClick={signIn}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold shadow hover:bg-primary/90 transition cursor-pointer flex justify-center items-center gap-3"
        >
          Log in{" "}
          <LoaderCircle
            className={`${loading ? "block animate-spin" : "hidden"}`}
            size={16}
          />
        </button>

        <button
          type="button"
          onClick={handleForgot}
          className="text-sm text-primary hover:underline w-max cursor-pointer mt-2"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
};

export default LoginForm;

"use client";
import React, { useRef, useState } from "react";
import { LoaderCircle, UserPlus2 } from "lucide-react";
import { useAuth } from "@/app/providers/auth-provider";
import { notify, messages } from "@/lib/notifications";
import { useRouter } from "next/navigation";
import { createUser } from "@/app/services/auth";

export type Payload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const SignupForm: React.FC = () => {
  const { signUpNewUser, signInWithEmail } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [payload, setPayload] = useState<Payload>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Errors>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const debounceTimers = useRef<
    Record<string, ReturnType<typeof setTimeout> | undefined>
  >({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  const validateField = (
    name: keyof Payload,
    value: string,
    currentPayload: Payload
  ): string => {
    switch (name) {
      case "email":
        return value && !emailRegex.test(value)
          ? "Please enter a valid email address"
          : "";

      case "password":
        if (!value) return "";
        return !passwordRegex.test(value)
          ? "Password must be at least 8 characters with at least one uppercase letter and one number"
          : "";

      case "confirmPassword":
        if (!value) return "";
        return value !== currentPayload.password
          ? "Passwords do not match"
          : "";

      default:
        return "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const name = e.target.name as keyof Payload;
    const value = e.target.value;

    // Update payload immediately
    setPayload(
      (prev: Payload) =>
        ({
          ...prev,
          [name]: value,
        } as Payload)
    );

    // Clear existing debounce timer for this field
    if (debounceTimers.current[name as string]) {
      clearTimeout(debounceTimers.current[name as string]);
    }

    // Set new debounce timer for validation
    debounceTimers.current[name as string] = setTimeout(() => {
      setPayload((currentPayload: Payload) => {
        const error = validateField(name, value, currentPayload);

        setErrors(
          (prevErrors: Errors) =>
            ({
              ...prevErrors,
              [name]: error,
            } as Errors)
        );

        if (name === "password" && currentPayload.confirmPassword) {
          const confirmError = validateField(
            "confirmPassword",
            currentPayload.confirmPassword,
            {
              ...currentPayload,
              password: value,
            }
          );

          setErrors(
            (prev: Errors) =>
              ({
                ...prev,
                confirmPassword: confirmError,
              } as Errors)
          );
        }

        return currentPayload;
      });
    }, 300);
  };

  const validateSubmit = (): boolean => {
    const newErrors: Errors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    // Check each required field
    if (!payload.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!payload.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!payload.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!payload.password.trim()) {
      newErrors.password = "Password is required";
    }

    if (!payload.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    }

    // Set all errors at once
    setErrors(newErrors);

    // Return true if no errors (form is valid)
    return Object.keys(newErrors).length === 0;
  };

  async function signUp() {
    setLoading(true);

    try {
      if (!!validateSubmit()) return;
      const authData = await signUpNewUser(payload);

      notify.success(messages.auth.signupSuccess);

      await createUser(authData, payload);
      await signInWithEmail(payload);

      router.push("/");
    } catch (error) {
      console.log(error);
      notify.fromError(error, messages.auth.signupFailed);
    } finally {
      setLoading(false);
    }
  }

  const hasErrors = Object.values(errors).some(
    (error) => error !== "" && error !== undefined
  );

  return (
    <div className="w-[90%] lg:w-96 p-6 border border-primary rounded-lg shadow-lg flex flex-col bg-card">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus2 className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-bold text-primary">Sign Up</h3>
      </div>
      <form className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="First Name"
          className="px-3 py-2 border border-border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={handleChange}
          name="firstName"
        />
        {errors.firstName && (
          <span className="error text-xs text-destructive">{errors.firstName}</span>
        )}
        <input
          type="text"
          placeholder="Last Name"
          className="px-3 py-2 border border-border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={handleChange}
          name="lastName"
        />
        {errors.lastName && (
          <span className="error text-xs text-destructive">{errors.lastName}</span>
        )}

        <input
          type="email"
          placeholder="Email"
          className="px-3 py-2 border border-border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={payload.email}
          onChange={handleChange}
          name="email"
        />
        {errors.email && (
          <span className="error text-xs text-destructive">{errors.email}</span>
        )}

        <input
          type="password"
          placeholder="Password"
          className="px-3 py-2 border border-border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={payload.password}
          onChange={handleChange}
          name="password"
        />
        {errors.password && (
          <span className="error text-xs text-destructive">{errors.password}</span>
        )}

        <input
          type="password"
          placeholder="Confirm Password"
          className="px-3 py-2 border border-border rounded-md text-sm shadow-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          name="confirmPassword"
          onChange={handleChange}
        />
        {errors.confirmPassword && (
          <span className="error text-xs text-destructive">
            {errors.confirmPassword}
          </span>
        )}
      </form>
      <button
        onClick={signUp}
        className={`px-4 py-2 text-primary-foreground rounded-md font-semibold shadow hover:bg-primary/90 transition mt-4 flex justify-center items-center gap-3 ${
          hasErrors
            ? "cursor-not-allowed bg-primary/45"
            : "bg-primary cursor-pointer"
        }`}
        disabled={hasErrors}
      >
        Register{" "}
        <LoaderCircle
          className={`${loading ? "block animate-spin" : "hidden"}`}
        />
      </button>
    </div>
  );
};

export default SignupForm;

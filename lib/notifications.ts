/**
 * Global notification architecture.
 *
 * A single source of truth for every user-facing toast in the app. Instead of
 * scattering `toast.success("...")` / `toast.error("...")` calls (with slightly
 * different wording) across every component, flows import `notify` and the
 * `messages` catalog from here.
 *
 * Why centralize:
 * - Consistent wording, tone, durations and icons everywhere.
 * - One place to clean up the messy `Error: ...` / `String(error)` strings that
 *   bubble up from server actions into something a human wants to read.
 * - Server actions return structured `{ status, error }` results; `notifyResult`
 *   turns those into the right toast with a single call.
 *
 * NOTE: This module imports `sonner`, which is client-only. Import it from
 * client components (`"use client"`), never from `"use server"` files.
 */
import { toast } from "sonner";

/** Shape returned by every server action in `app/services/*`. */
export interface ActionResult<T = unknown> {
  status: "SUCCESS" | "ERROR" | string;
  error?: string | Record<string, unknown> | null;
  data?: T;
  // services occasionally tack on extra keys (e.g. `newStatus`, `res`)
  [key: string]: unknown;
}

type ToastOptions = Parameters<typeof toast>[1];

const DEFAULTS = {
  success: { duration: 3500 },
  error: { duration: 5000 },
  info: { duration: 4000 },
  warning: { duration: 4500 },
} as const;

/**
 * Turn whatever a server action / catch block throws into a clean,
 * human-readable sentence.
 *
 * Handles the patterns actually used in this codebase:
 * - `Error` instances → their `.message`
 * - `String(error)` outputs like `"Error: Production is closed"`
 * - the colon-split convention used by some services (`a: b: real message`)
 * - structured `{ message }` objects
 * Falls back to a friendly generic message rather than leaking `[object Object]`
 * or an empty string.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  let raw = "";

  if (typeof error === "string") {
    raw = error;
  } else if (error instanceof Error) {
    raw = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    raw = String((error as { message: unknown }).message ?? "");
  } else if (error != null) {
    raw = String(error);
  }

  raw = raw.trim();

  if (
    !raw ||
    raw === "[object Object]" ||
    raw === "undefined" ||
    raw === "null"
  ) {
    return fallback;
  }

  // Server actions frequently wrap messages as `Error: <real message>` and some
  // re-throw nested (`Error: Error: <msg>`). Keep the last meaningful segment.
  const segments = raw
    .split(":")
    .map((s) => s.trim())
    .filter(Boolean);

  // If every segment is just the word "error", there is no real message.
  const meaningful = segments.filter((s) => s.toLowerCase() !== "error");
  if (meaningful.length > 0) {
    raw = meaningful[meaningful.length - 1];
  }

  // Drop a generic catch-all so we can surface the friendlier fallback instead.
  if (/^unexpected error( occured| occurred)?\.?$/i.test(raw)) {
    return fallback;
  }

  return raw;
}

/**
 * Thin, semantic wrapper around sonner's `toast` with consistent defaults.
 * Use this everywhere instead of importing `toast` directly so styling and
 * durations stay uniform.
 */
export const notify = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, { ...DEFAULTS.success, ...options }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, { ...DEFAULTS.error, ...options }),

  info: (message: string, options?: ToastOptions) =>
    toast.info(message, { ...DEFAULTS.info, ...options }),

  warning: (message: string, options?: ToastOptions) =>
    toast.warning(message, { ...DEFAULTS.warning, ...options }),

  loading: (message: string, options?: ToastOptions) =>
    toast.loading(message, options),

  message: (message: string, options?: ToastOptions) => toast(message, options),

  /** Bridge an unknown thrown value straight to an error toast. */
  fromError: (error: unknown, fallback?: string, options?: ToastOptions) =>
    toast.error(getErrorMessage(error, fallback), {
      ...DEFAULTS.error,
      ...options,
    }),

  /** Drive a toast through the lifecycle of a promise. */
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ) =>
    toast.promise(promise, {
      loading: msgs.loading,
      success: msgs.success,
      error: (err) =>
        typeof msgs.error === "function"
          ? msgs.error(err)
          : getErrorMessage(err, msgs.error),
    }),

  dismiss: (id?: string | number) => toast.dismiss(id),
} as const;

/**
 * Show the correct toast for a server-action result and report whether it
 * succeeded. Centralizes the `if (result.status === "SUCCESS") ... else ...`
 * pattern repeated across every form/dialog.
 *
 * @returns `true` when the action succeeded, `false` otherwise.
 *
 * @example
 *   const result = await deleteSale(sale.id);
 *   if (notifyResult(result, { success: messages.sale.deleted })) {
 *     onOpenChange(false);
 *   }
 */
export function notifyResult<T>(
  result: ActionResult<T> | null | undefined,
  msgs: { success: string; error?: string },
): boolean {
  if (result && result.status === "SUCCESS") {
    notify.success(msgs.success);
    return true;
  }

  notify.error(getErrorMessage(result?.error, msgs.error));
  return false;
}

/** Toast for a failed Zod (or similar) input validation. */
export function notifyValidationError(
  message = messages.generic.validation,
): void {
  notify.error(message);
}

/**
 * Catalog of meaningful, domain-specific messages used across all flows.
 * Keep wording here so copy stays consistent and easy to audit/translate.
 */
export const messages = {
  generic: {
    validation: "Please check the highlighted fields and try again.",
    unexpected: "Something went wrong. Please try again.",
    loading: "Working on it…",
    loadFailed: "Couldn't load data. Please refresh and try again.",
  },
  sale: {
    created: "Sale recorded successfully.",
    updated: "Sale updated successfully.",
    deleted: "Sale deleted successfully.",
    createFailed: "Couldn't record the sale. Please try again.",
    updateFailed: "Couldn't update the sale. Please try again.",
    deleteFailed: "Couldn't delete the sale. Please try again.",
    invalidAmount: "Enter a valid amount greater than zero.",
    invalidAmountPaid: "Enter a valid amount paid.",
    overpayment: "Amount paid can't exceed the total amount.",
  },
  payment: {
    created: "Payment recorded successfully.",
    updated: "Payment updated successfully.",
    deleted: "Payment deleted successfully.",
    createFailed: "Couldn't record the payment. Please try again.",
    updateFailed: "Couldn't update the payment. Please try again.",
    deleteFailed: "Couldn't delete the payment. Please try again.",
    invalidAmount: "Enter a valid payment amount.",
    distributed: (cleared: number, partial: number) =>
      `Payment distributed: ${cleared || 0} sale(s) cleared, ${partial} partially paid.`,
    distributeFailed: "Couldn't distribute the payment. Please try again.",
  },
  customer: {
    created: "Customer added successfully.",
    updated: "Customer updated successfully.",
    deleted: "Customer deleted successfully.",
    createFailed: "Couldn't add the customer. Please try again.",
    updateFailed: "Couldn't update the customer. Please try again.",
    deleteFailed: "Couldn't delete the customer. Please try again.",
  },
  production: {
    created: "Production created successfully.",
    updated: "Production updated successfully.",
    deleted: "Production deleted successfully.",
    createFailed: "Couldn't create the production. Please try again.",
    updateFailed: "Couldn't update the production. Please try again.",
    deleteFailed: "Couldn't delete the production. Please try again.",
    closedUpdate: "This production is closed and can no longer be updated.",
    closedDelete: "This production is closed and can no longer be deleted.",
    cashUpdated: "Cash at hand updated successfully.",
    cashFailed: "Couldn't update cash at hand. Please try again.",
    invalidCash: "Enter a valid cash amount.",
    statusToggled: (open: boolean) =>
      open ? "Production reopened." : "Production closed.",
    statusFailed: "Couldn't change the production status. Please try again.",
  },
  expense: {
    created: "Expense added successfully.",
    updated: "Expense updated successfully.",
    deleted: "Expense deleted successfully.",
    createFailed: "Couldn't add the expense. Please try again.",
    updateFailed: "Couldn't update the expense. Please try again.",
    deleteFailed: "Couldn't delete the expense. Please try again.",
    closedUpdate:
      "This expense belongs to a closed production and can't be updated.",
    closedDelete:
      "This expense belongs to a closed production and can't be deleted.",
  },
  breadPrice: {
    added: "Bread price added successfully.",
    updated: "Bread price updated successfully.",
    deleted: "Price entry deleted successfully.",
    addFailed: "Couldn't add the bread price. Please try again.",
    updateFailed: "Couldn't update the bread price. Please try again.",
    deleteFailed: "Couldn't delete the price entry. Please try again.",
  },
  user: {
    created: "User created successfully.",
    updated: "User updated successfully.",
    deleted: "User deleted successfully.",
    createFailed: "Couldn't create the user. Please try again.",
    updateFailed: "Couldn't update the user. Please try again.",
    deleteFailed: "Couldn't delete the user. Please try again.",
  },
  auth: {
    passwordUpdated: "Password updated successfully.",
    passwordFailed: "Couldn't update your password. Please try again.",
    resetEmailSent: "Password reset email sent. Check your inbox.",
    resetEmailFailed: "Couldn't send the reset email. Please try again.",
    loginSuccess: "Welcome back! You're logged in.",
    loginFailed: "Login failed. Check your credentials and try again.",
    signupSuccess: "Account created. Signing you in…",
    signupFailed: "Registration failed. Please try again.",
  },
} as const;

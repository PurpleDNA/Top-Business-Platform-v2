"use client";

import { useState, useRef, useEffect } from "react";
import { updateProduction, Production } from "@/app/services/productions";
import { useRouter } from "next/navigation";
import { notify, notifyResult, messages } from "@/lib/notifications";
import { Loader2 } from "lucide-react";
import { formatNaira } from "@/app/services/utils";

interface ProductionMoneyInputProps {
  productionId: string;
  initialValue: number;
  /** Which production money column this edits. */
  field: "cash" | "transfer";
  /** Heading shown above the value (e.g. "Cash Collected"). */
  label: string;
}

// Per-field copy. Kept here (a client component) so the server page never has
// to import `messages` from notifications.ts (which pulls in client-only sonner).
const COPY = {
  cash: {
    invalid: messages.production.invalidCash,
    success: messages.production.cashUpdated,
    fail: messages.production.cashFailed,
  },
  transfer: {
    invalid: messages.production.invalidTransfer,
    success: messages.production.transferUpdated,
    fail: messages.production.transferFailed,
  },
} as const;

/**
 * Inline-editable money field for a production (used for both `cash` and
 * `transfer`). Click to edit, Enter/blur to save, Escape to cancel.
 */
export const ProductionMoneyInput = ({
  productionId,
  initialValue,
  field,
  label,
}: ProductionMoneyInputProps) => {
  const { invalid: invalidMessage, success: successMessage, fail: failMessage } =
    COPY[field];
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(initialValue));
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (isLoading) return;

    const newValue = Number(inputValue);

    // Validate
    if (isNaN(newValue) || newValue < 0) {
      notify.error(invalidMessage);
      setInputValue(String(value));
      setIsEditing(false);
      return;
    }

    // If no change, just exit editing mode
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);

    try {
      const payload: Partial<Production> =
        field === "cash" ? { cash: newValue } : { transfer: newValue };
      const result = await updateProduction(productionId, payload);

      if (notifyResult(result, { success: successMessage, error: failMessage })) {
        setValue(newValue);
        router.refresh();
      } else {
        setInputValue(String(value));
      }
    } catch (error) {
      notify.fromError(error, failMessage);
      setInputValue(String(value));
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setInputValue(String(value));
      setIsEditing(false);
    }
  };

  return (
    <div className="rounded-lg bg-green-500/10 ring-1 ring-green-500/20 p-3">
      <p className="text-xs text-green-400 mb-1">{label}</p>
      {isEditing ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full text-lg font-semibold text-foreground bg-transparent border-b border-green-400 outline-none focus:border-green-300 no-spinners"
            disabled={isLoading}
          />
          {isLoading && (
            <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-green-400" />
          )}
        </div>
      ) : (
        <p
          className="text-lg font-semibold text-foreground cursor-pointer hover:text-green-400 transition-colors"
          onClick={() => setIsEditing(true)}
        >
          {formatNaira(value)}
        </p>
      )}
    </div>
  );
};

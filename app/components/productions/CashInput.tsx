"use client";

import { useState, useRef, useEffect } from "react";
import { updateProduction } from "@/app/services/productions";
import { useRouter } from "next/navigation";
import { notify, notifyResult, messages } from "@/lib/notifications";
import { Loader2 } from "lucide-react";

interface CashInputProps {
  productionId: string;
  initialCash: number;
}

export const CashInput = ({ productionId, initialCash }: CashInputProps) => {
  const [cash, setCash] = useState(initialCash);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(initialCash));
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

    const newCash = Number(inputValue);

    // Validate
    if (isNaN(newCash) || newCash < 0) {
      notify.error(messages.production.invalidCash);
      setInputValue(String(cash));
      setIsEditing(false);
      return;
    }

    // If no change, just exit editing mode
    if (newCash === cash) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProduction(productionId, { cash: newCash });

      if (notifyResult(result, { success: messages.production.cashUpdated, error: messages.production.cashFailed })) {
        setCash(newCash);
        router.refresh();
      } else {
        setInputValue(String(cash));
      }
    } catch (error) {
      notify.fromError(error, messages.production.cashFailed);
      setInputValue(String(cash));
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setInputValue(String(cash));
      setIsEditing(false);
    }
  };

  return (
    <div className="rounded-lg bg-green-500/10 ring-1 ring-green-500/20 p-3">
      <p className="text-xs text-green-400 mb-1">Cash Collected</p>
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
          ₦{cash.toLocaleString()}
        </p>
      )}
    </div>
  );
};

"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { updateUserPassword } from "@/app/services/users";
import { notify, getErrorMessage, messages } from "@/lib/notifications";
import { Loader2 } from "lucide-react";

export default function ChangePasswordPage() {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isConfirmTouched, setIsConfirmTouched] = useState(false);
  const [isNewTouched, setIsNewTouched] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const isPasswordLongEnough = newPassword.length >= 8;
  
  const showMatchError = isConfirmTouched && !passwordsMatch && confirmPassword.length > 0;
  const showLengthError = isNewTouched && !isPasswordLongEnough && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch || !isPasswordLongEnough) return;

    setIsPending(true);
    try {
      const result = await updateUserPassword(newPassword);
      if (result.success) {
        notify.success(messages.auth.passwordUpdated);
        setNewPassword("");
        setConfirmPassword("");
        setIsConfirmTouched(false);
        setIsNewTouched(false);
      } else {
        notify.error(getErrorMessage(result.error, messages.auth.passwordFailed));
      }
    } catch (error) {
      notify.fromError(error, messages.auth.passwordFailed);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Change Password</h2>
        <p className="text-sm text-muted-foreground">
          Update your account password for security
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (!isNewTouched) setIsNewTouched(true);
                  }}
                  className={showLengthError ? "border-red-500 focus-visible:ring-red-500" : ""}
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNew(!showNew)}
                  disabled={isPending}
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {showLengthError && (
                <p className="text-sm text-red-500 mt-1">Password must be at least 8 characters long</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (!isConfirmTouched) setIsConfirmTouched(true);
                  }}
                  className={showMatchError ? "border-red-500 focus-visible:ring-red-500" : ""}
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={isPending}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {showMatchError && (
                <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!passwordsMatch || !isPasswordLongEnough || !newPassword || !confirmPassword || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">Password Requirements</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains at least one uppercase letter</li>
              <li>• Contains at least one number</li>
              <li>• Contains at least one special character</li>
              <li>• Just kidding, only the first one matters</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

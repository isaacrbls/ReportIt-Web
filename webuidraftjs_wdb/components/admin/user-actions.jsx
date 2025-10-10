"use client";

import { useState } from "react";
import { ref, update } from "firebase/database";
import { realtimeDb } from "@/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MoreHorizontal, 
  UserX, 
  UserCheck
} from "lucide-react";

export function UserActions({ user, onUpdate }) {
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Safety check
  if (!user) {
    return null;
  }

  const isSuspended = user.suspended || user.isSuspended;
  const isAdmin = user.role === "admin" || user.isAdmin;

  const showToast = (title, description, variant = "default") => {
    // Simple alert for now - can be replaced with proper toast later
    alert(`${title}\n${description}`);
  };

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      showToast("Error", "Please provide a reason for suspension", "destructive");
      return;
    }

    setProcessing(true);
    try {
      const userRef = ref(realtimeDb, `users/${user.id}`);
      const suspensionEndDate = new Date();
      suspensionEndDate.setDate(suspensionEndDate.getDate() + 14); // 14 days suspension

      // Increment suspension counter
      const currentCount = user.suspensionCount || 0;

      await update(userRef, {
        suspended: true,
        isSuspended: true,
        suspensionReason: suspensionReason.trim(),
        suspensionDate: new Date().toISOString(),
        suspensionEndDate: suspensionEndDate.toISOString(),
        suspendedBy: "admin", // You can replace with actual admin ID
        suspensionCount: currentCount + 1,
        updatedAt: new Date().toISOString(),
      });

      showToast("User suspended", `${user.email} has been suspended for 14 days`);

      setShowSuspendDialog(false);
      setSuspensionReason("");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error suspending user:", error);
      showToast("Error", "Failed to suspend user. Please try again.", "destructive");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnsuspend = async () => {
    setProcessing(true);
    try {
      const userRef = ref(realtimeDb, `users/${user.id}`);
      await update(userRef, {
        suspended: false,
        isSuspended: false,
        suspensionReason: null,
        suspensionDate: null,
        suspensionEndDate: null,
        unsuspendedAt: new Date().toISOString(),
        unsuspendedBy: "admin", // You can replace with actual admin ID
        updatedAt: new Date().toISOString(),
      });

      showToast("User unsuspended", `${user.email} has been reactivated`);

      setShowUnsuspendDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error unsuspending user:", error);
      showToast("Error", "Failed to unsuspend user. Please try again.", "destructive");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isSuspended ? (
            <DropdownMenuItem onClick={() => setShowUnsuspendDialog(true)}>
              <UserCheck className="mr-2 h-4 w-4" />
              Unsuspend User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setShowSuspendDialog(true)}>
              <UserX className="mr-2 h-4 w-4" />
              Suspend User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend Dialog */}
      <Dialog 
        open={showSuspendDialog} 
        onOpenChange={(open) => {
          setShowSuspendDialog(open);
          if (!open) {
            // Clear the reason field when dialog is closed
            setSuspensionReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]" style={{ textAlign: 'left' }}>
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-left">
              Suspend User
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-left">
              This will suspend {user.email} for 14 days. They will not be able to submit reports or access their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label htmlFor="reason" className="text-left block">Reason for suspension</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for suspending this user..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendDialog(false);
                setSuspensionReason("");
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={processing || !suspensionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? "Suspending..." : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog */}
      <Dialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
        <DialogContent className="sm:max-w-[500px]" style={{ textAlign: 'left' }}>
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-left">
              Unsuspend User
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-left">
              This will reactivate {user.email}'s account. They will be able to submit reports and access their account again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowUnsuspendDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnsuspend}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? "Unsuspending..." : "Unsuspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

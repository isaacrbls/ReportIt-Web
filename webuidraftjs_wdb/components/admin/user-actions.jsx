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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MoreHorizontal, 
  UserX, 
  UserCheck, 
  Shield, 
  ShieldOff,
  Trash2 
} from "lucide-react";

export function UserActions({ user, onUpdate }) {
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showDemoteDialog, setShowDemoteDialog] = useState(false);
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

      await update(userRef, {
        suspended: true,
        isSuspended: true,
        suspensionReason: suspensionReason.trim(),
        suspensionDate: new Date().toISOString(),
        suspensionEndDate: suspensionEndDate.toISOString(),
        suspendedBy: "admin", // You can replace with actual admin ID
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

  const handlePromoteToAdmin = async () => {
    setProcessing(true);
    try {
      const userRef = ref(realtimeDb, `users/${user.id}`);
      await update(userRef, {
        role: "admin",
        isAdmin: true,
        promotedAt: new Date().toISOString(),
        promotedBy: "admin", // You can replace with actual admin ID
        updatedAt: new Date().toISOString(),
      });

      showToast("User promoted", `${user.email} is now an administrator`);

      setShowPromoteDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error promoting user:", error);
      showToast("Error", "Failed to promote user. Please try again.", "destructive");
    } finally {
      setProcessing(false);
    }
  };

  const handleDemoteFromAdmin = async () => {
    setProcessing(true);
    try {
      const userRef = ref(realtimeDb, `users/${user.id}`);
      await update(userRef, {
        role: "user",
        isAdmin: false,
        demotedAt: new Date().toISOString(),
        demotedBy: "admin", // You can replace with actual admin ID
        updatedAt: new Date().toISOString(),
      });

      showToast("User demoted", `${user.email} is now a regular user`);

      setShowDemoteDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error demoting user:", error);
      showToast("Error", "Failed to demote user. Please try again.", "destructive");
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

          <DropdownMenuSeparator />

          {isAdmin ? (
            <DropdownMenuItem onClick={() => setShowDemoteDialog(true)}>
              <ShieldOff className="mr-2 h-4 w-4" />
              Remove Admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setShowPromoteDialog(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Make Admin
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend {user.email} for 14 days. They will not be able to submit reports or access their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">Reason for suspension</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for suspending this user..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={processing || !suspensionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? "Suspending..." : "Suspend User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsuspend Dialog */}
      <AlertDialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsuspend User</AlertDialogTitle>
            <AlertDialogDescription>
              This will reactivate {user.email}'s account. They will be able to submit reports and access their account again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsuspend}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? "Unsuspending..." : "Unsuspend User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Dialog */}
      <AlertDialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              This will grant {user.email} administrator privileges. They will have full access to the admin panel and all management features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromoteToAdmin}
              disabled={processing}
            >
              {processing ? "Promoting..." : "Promote to Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demote Dialog */}
      <AlertDialog open={showDemoteDialog} onOpenChange={setShowDemoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Administrator Role</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove administrator privileges from {user.email}. They will become a regular user with limited access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemoteFromAdmin}
              disabled={processing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {processing ? "Removing..." : "Remove Admin Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

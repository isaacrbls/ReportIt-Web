"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Save,
  X
} from "lucide-react";
import { updateUserProfile } from "@/lib/userManagementAPI";
import { useToast } from "@/hooks/use-toast";

export function UserDetailsDialog({ user, open, onOpenChange, onUpdate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [suspensionHistory, setSuspensionHistory] = useState([]);
  const [reportStats, setReportStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      setCurrentUser(user);
      fetchUserData();
      // Initialize edit form with user data
      setEditedUser({
        username: user.username || user.email?.split('@')[0] || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || ""
      });
      setIsEditing(false);
    }
  }, [open, user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch ALL user's reports using email
      const reportsRef = collection(db, "reports");
      
      // Try with SubmittedBy field first (email stored directly)
      let reportsQuery = query(
        reportsRef,
        where("SubmittedBy", "==", user.email)
      );
      
      let reportsSnapshot = await getDocs(reportsQuery);
      
      // If no results, try with SubmittedByEmail field
      if (reportsSnapshot.size === 0) {
        reportsQuery = query(
          reportsRef,
          where("SubmittedByEmail", "==", user.email)
        );
        reportsSnapshot = await getDocs(reportsQuery);
      }
      
      // If still no results, try with lowercase field
      if (reportsSnapshot.size === 0) {
        reportsQuery = query(
          reportsRef,
          where("submittedByEmail", "==", user.email)
        );
        reportsSnapshot = await getDocs(reportsQuery);
      }
      
      const allReports = reportsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Calculate statistics from ALL reports
      const stats = {
        total: allReports.length,
        verified: allReports.filter(r => (r.Status || r.status)?.toLowerCase() === "verified").length,
        pending: allReports.filter(r => (r.Status || r.status)?.toLowerCase() === "pending").length,
        rejected: allReports.filter(r => (r.Status || r.status)?.toLowerCase() === "rejected").length
      };
      
      setReportStats(stats);
      
      // Sort reports by date for display (most recent first)
      allReports.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || a.DateTime?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || b.DateTime?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      // Show ALL reports in the reports tab
      setUserReports(allReports);

      // Fetch suspension history (handle potential errors)
      try {
        const suspensionsRef = collection(db, "userSuspensions");
        const suspensionsQuery = query(
          suspensionsRef,
          where("userId", "==", user.id)
        );
        const suspensionsSnapshot = await getDocs(suspensionsQuery);
        const suspensions = suspensionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSuspensionHistory(suspensions);
      } catch (suspensionError) {
        setSuspensionHistory([]);
      }
    } catch (error) {
      // Still set empty array to avoid undefined errors
      setUserReports([]);
      setSuspensionHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile(user.id, {
        username: editedUser.username,
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        email: editedUser.email
      });
      
      // Update local user state
      const updatedUser = {
        ...currentUser,
        username: editedUser.username,
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        email: editedUser.email
      };
      setCurrentUser(updatedUser);
      
      toast({
        title: "Profile Updated",
        description: "User profile has been successfully updated.",
      });
      
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({
      username: currentUser?.username || currentUser?.email?.split('@')[0] || "",
      firstName: currentUser?.firstName || "",
      lastName: currentUser?.lastName || "",
      email: currentUser?.email || ""
    });
    setIsEditing(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    const statusMap = {
      pending: { variant: "outline", label: "Pending", icon: Clock },
      verified: { variant: "success", label: "Verified", icon: CheckCircle },
      approved: { variant: "success", label: "Approved", icon: CheckCircle },
      rejected: { variant: "destructive", label: "Rejected", icon: XCircle },
      resolved: { variant: "default", label: "Resolved", icon: CheckCircle }
    };

    const config = statusMap[statusLower] || statusMap.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about {currentUser?.firstName && currentUser?.lastName 
              ? `${currentUser.firstName} ${currentUser.lastName}` 
              : currentUser?.displayName || currentUser?.name || currentUser?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-2 -mr-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reports">Reports ({reportStats.total})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 mt-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base text-red-600">Account Information</CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="gap-2 bg-red-600 hover:bg-red-700"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Username</div>
                      {isEditing ? (
                        <Input
                          value={editedUser.username}
                          onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                          placeholder="Enter username"
                          className="font-mono"
                        />
                      ) : (
                        <div className="text-sm mt-1 font-mono">{currentUser?.username || currentUser?.email?.split('@')[0] || "N/A"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Full Name</div>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            value={editedUser.firstName}
                            onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                            placeholder="First name"
                          />
                          <Input
                            value={editedUser.lastName}
                            onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                            placeholder="Last name"
                          />
                        </div>
                      ) : (
                        <div className="text-sm mt-1">
                          {currentUser?.firstName && currentUser?.lastName 
                            ? `${currentUser.firstName} ${currentUser.lastName}` 
                            : currentUser?.firstName || currentUser?.lastName || currentUser?.displayName || currentUser?.name || "N/A"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Email</div>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editedUser.email}
                          onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                          placeholder="Enter email"
                        />
                      ) : (
                        <div className="text-sm mt-1 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {currentUser?.email || "N/A"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Role</div>
                      <div className="text-sm mt-1">
                        {currentUser?.role === "admin" || currentUser?.isAdmin ? (
                          <Badge className="bg-red-600 text-white gap-1">
                            <Shield className="h-3 w-3" />
                            Administrator
                          </Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Account Status</div>
                      <div className="text-sm mt-1">
                        {currentUser?.suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Joined Date</div>
                      <div className="text-sm mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(currentUser?.createdAt)}
                      </div>
                    </div>
                  </div>

                  {currentUser?.suspended && (
                    <>
                      <Separator />
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-red-900">Account Suspended</div>
                            <div className="text-sm text-red-700 mt-1">
                              {currentUser.suspensionReason || "No reason provided"}
                            </div>
                            {currentUser.suspensionEndDate && (
                              <div className="text-sm text-red-600 mt-2">
                                Suspended until: {formatDate(currentUser.suspensionEndDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-600">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-red-600">{reportStats.total}</div>
                      <div className="text-xs text-muted-foreground mt-1">Total Reports</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-green-600">
                        {reportStats.verified}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Verified Reports</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-yellow-600">
                        {reportStats.pending}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Pending Reports</div>
                    </div>
                    <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-200 hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-rose-600">
                        {reportStats.rejected}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Rejected Reports</div>
                    </div>
                    <div className="col-span-2 text-center p-4 bg-orange-50 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-orange-600">
                        {user.suspensionCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Total Suspensions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-600">
                    <FileText className="h-4 w-4" />
                    All Reports
                  </CardTitle>
                  <CardDescription>
                    All {userReports.length} reports submitted by this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center text-muted-foreground py-8">Loading...</div>
                  ) : userReports.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No reports found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userReports.map((report) => (
                        <div
                          key={report.id}
                          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{report.Category || report.category || "Uncategorized"}</div>
                            {getStatusBadge(report.Status || report.status)}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {report.Description || report.description || "No description"}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(report.createdAt || report.DateTime || report.timestamp)}
                            </div>
                            {(report.Barangay || report.barangay) && (
                              <div>{report.Barangay || report.barangay}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

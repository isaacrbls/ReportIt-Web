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
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export function UserDetailsDialog({ user, open, onOpenChange, onUpdate }) {
  const [userReports, setUserReports] = useState([]);
  const [suspensionHistory, setSuspensionHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserData();
    }
  }, [open, user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      console.log("📊 Fetching reports for user:", user.email);
      
      // Fetch user's reports using email
      const reportsRef = collection(db, "reports");
      
      // Try with SubmittedByEmail field
      let reportsQuery = query(
        reportsRef,
        where("SubmittedByEmail", "==", user.email)
      );
      
      console.log("📊 Executing query for email:", user.email);
      let reportsSnapshot = await getDocs(reportsQuery);
      
      console.log("📊 Reports found with SubmittedByEmail:", reportsSnapshot.size);
      
      // If no results, try with lowercase field name
      if (reportsSnapshot.size === 0) {
        console.log("📊 Trying with submittedByEmail (lowercase)...");
        reportsQuery = query(
          reportsRef,
          where("submittedByEmail", "==", user.email)
        );
        reportsSnapshot = await getDocs(reportsQuery);
        console.log("📊 Reports found with submittedByEmail:", reportsSnapshot.size);
      }
      
      const reports = reportsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("📊 Report data:", {
          id: doc.id,
          Category: data.Category,
          Status: data.Status,
          SubmittedByEmail: data.SubmittedByEmail
        });
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Sort reports by date in memory
      reports.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || a.DateTime?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || b.DateTime?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      // Limit to 10 most recent
      const recentReports = reports.slice(0, 10);
      
      setUserReports(recentReports);
      console.log("✅ User reports set:", recentReports.length);

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
        console.log("⚠️ Suspension history not available:", suspensionError.message);
        setSuspensionHistory([]);
      }
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Error code:", error.code);
      // Still set empty array to avoid undefined errors
      setUserReports([]);
      setSuspensionHistory([]);
    } finally {
      setLoading(false);
    }
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
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about {user.displayName || user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[600px] overflow-y-auto pr-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reports">Reports ({userReports.length})</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-red-600">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">User ID</div>
                      <div className="text-sm mt-1 font-mono">{user.id}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Display Name</div>
                      <div className="text-sm mt-1">{user.displayName || user.name || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Email</div>
                      <div className="text-sm mt-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Role</div>
                      <div className="text-sm mt-1">
                        {user.role === "admin" || user.isAdmin ? (
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
                        {user.suspended || user.isSuspended ? (
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
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>

                  {(user.suspended || user.isSuspended) && (
                    <>
                      <Separator />
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-red-900">Account Suspended</div>
                            <div className="text-sm text-red-700 mt-1">
                              {user.suspensionReason || "No reason provided"}
                            </div>
                            {user.suspensionEndDate && (
                              <div className="text-sm text-red-600 mt-2">
                                Suspended until: {formatDate(user.suspensionEndDate)}
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
                <CardHeader>
                  <CardTitle className="text-base text-red-600">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{userReports.length}</div>
                      <div className="text-sm text-muted-foreground">Total Reports</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {userReports.filter(r => (r.Status || r.status)?.toLowerCase() === "verified").length}
                      </div>
                      <div className="text-sm text-muted-foreground">Verified Reports</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">
                        {userReports.filter(r => (r.Status || r.status)?.toLowerCase() === "pending").length}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending Reports</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-orange-600">
                        {suspensionHistory.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Suspensions</div>
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
                    Recent Reports
                  </CardTitle>
                  <CardDescription>
                    Last {userReports.length} reports submitted by this user
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

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Suspension History
                  </CardTitle>
                  <CardDescription>
                    All suspension records for this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center text-muted-foreground py-8">Loading...</div>
                  ) : suspensionHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No suspension history
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suspensionHistory.map((suspension) => (
                        <div
                          key={suspension.id}
                          className="border rounded-lg p-4 bg-red-50 border-red-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-red-900">
                              Suspension #{suspension.id.slice(0, 8)}
                            </div>
                            <Badge variant={suspension.isActive ? "destructive" : "outline"}>
                              {suspension.isActive ? "Active" : "Expired"}
                            </Badge>
                          </div>
                          <div className="text-sm text-red-700 mb-2">
                            {suspension.reason || "No reason provided"}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-red-600">
                            <div>
                              <span className="font-medium">Suspended: </span>
                              {formatDate(suspension.suspendedAt)}
                            </div>
                            <div>
                              <span className="font-medium">Until: </span>
                              {formatDate(suspension.suspensionEndDate)}
                            </div>
                            <div>
                              <span className="font-medium">Rejection Count: </span>
                              {suspension.totalRejections || 0}
                            </div>
                            {suspension.unsuspendedAt && (
                              <div>
                                <span className="font-medium">Unsuspended: </span>
                                {formatDate(suspension.unsuspendedAt)}
                              </div>
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

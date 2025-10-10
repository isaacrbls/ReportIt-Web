"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ref, onValue, get } from "firebase/database";
import { realtimeDb } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserDetailsDialog } from "@/components/admin/user-details-dialog";
import { UserActions } from "@/components/admin/user-actions";
import { Search, Users, UserCheck, UserX, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/admin/Sidebar";
import LogoutConfirmationModal from "@/components/admin/LogoutConfirmationModal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getUserBarangay } from "@/lib/userMapping";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    admins: 0
  });
  const router = useRouter();
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [currentUserBarangay, setCurrentUserBarangay] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    // Recalculate stats when barangay changes
    if (currentUserBarangay) {
      calculateStats(users);
    }
  }, [users, searchTerm, filterStatus, currentUserBarangay]);

  useEffect(() => {
    if (currentUser?.email) {
      const barangay = getUserBarangay(currentUser.email);
      setCurrentUserBarangay(barangay);
      console.log("👤 Current user barangay:", barangay);
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = ref(realtimeDb, "users");
      
      // Use onValue for real-time updates
      const unsubscribe = onValue(usersRef, (snapshot) => {
        const usersData = [];
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Convert object to array and add user IDs
          Object.keys(data).forEach((userId) => {
            usersData.push({
              id: userId,
              ...data[userId]
            });
          });
          
          // Sort by createdAt if available
          usersData.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
          });
          
          console.log("👥 Fetched users from Realtime Database:", usersData.length);
        }

        setUsers(usersData);
        calculateStats(usersData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching users from Realtime Database:", error);
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up users listener:", error);
      setLoading(false);
    }
  };

  const calculateStats = (usersData) => {
    // Filter to only include non-admin users from current barangay
    let filteredUsers = usersData.filter(u => u.role !== "admin" && !u.isAdmin);
    
    // Filter by current user's barangay
    if (currentUserBarangay) {
      filteredUsers = filteredUsers.filter(user => {
        const userBarangay = user.barangay || getUserBarangay(user.email);
        return userBarangay && userBarangay.toLowerCase() === currentUserBarangay.toLowerCase();
      });
    }
    
    const stats = {
      total: filteredUsers.length,
      active: filteredUsers.filter(u => !u.suspended && !u.isSuspended).length,
      suspended: filteredUsers.filter(u => u.suspended || u.isSuspended).length,
      admins: 0 // Not showing admins anymore
    };
    setStats(stats);
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by current user's barangay
    if (currentUserBarangay) {
      filtered = filtered.filter(user => {
        // First check if user has barangay field in their data
        const userBarangay = user.barangay || getUserBarangay(user.email);
        return userBarangay && userBarangay.toLowerCase() === currentUserBarangay.toLowerCase();
      });
    }

    // Filter out admins - only show regular users
    filtered = filtered.filter(user => {
      return user.role !== "admin" && !user.isAdmin;
    });

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      if (filterStatus === "active") {
        filtered = filtered.filter(u => !u.suspended && !u.isSuspended);
      } else if (filterStatus === "suspended") {
        filtered = filtered.filter(u => u.suspended || u.isSuspended);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleUserUpdate = () => {
    fetchUsers();
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/");
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  const getUserStatus = (user) => {
    if (user.suspended || user.isSuspended) return "suspended";
    return "active";
  };

  return (
    <>
      <div className="flex min-h-screen bg-white">
        {/* Sidebar */}
        <Sidebar onLogout={() => setShowLogoutModal(true)} />
        
        {/* Main Content */}
        <main className="flex-1 ml-64 p-10 bg-white min-h-screen">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-red-600">Manage Users</h1>
              {currentUserBarangay && (
                <p className="text-sm text-gray-600 mt-1">
                  Showing users from <span className="font-semibold text-red-600">{currentUserBarangay}</span>
                </p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Total Users</div>
                <Users className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600">{stats.total}</div>
            </div>
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Active Users</div>
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            </div>
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Suspended Users</div>
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600">{stats.suspended}</div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-red-600 mb-1">Users</h2>
              <p className="text-gray-500">
                View and manage users from {currentUserBarangay || "your barangay"}
              </p>
            </div>
            
            <div className="p-6">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 flex items-center bg-white border rounded-lg px-4 py-2">
                  <Search className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search by email, name, or ID..."
                    className="flex-1 outline-none bg-transparent text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="border rounded-lg px-4 py-2 text-base text-gray-700 bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Barangay</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Joined</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-red-600">
                                    {(user.firstName || user.lastName || user.email)?.[0]?.toUpperCase() || "U"}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold">{user.username || user.email?.split('@')[0] || "Unknown"}</div>
                                  <div className="text-xs text-gray-500">
                                    {user.firstName && user.lastName 
                                      ? `${user.firstName} ${user.lastName}` 
                                      : user.firstName || user.lastName || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">{user.email || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-red-300 text-red-700">
                                {user.barangay || getUserBarangay(user.email) || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.role === "admin" || user.isAdmin ? (
                                <Badge className="bg-red-600 text-white border-0">Admin</Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-300">User</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {getUserStatus(user) === "suspended" ? (
                                <Badge variant="destructive">Suspended</Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-700">{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  className="px-4 py-1.5 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  onClick={() => handleViewDetails(user)}
                                >
                                  View Details
                                </button>
                                <UserActions user={user} onUpdate={handleUserUpdate} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* User Details Dialog */}
      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          open={showDetails}
          onOpenChange={setShowDetails}
          onUpdate={handleUserUpdate}
        />
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, LogOut, CheckCircle, XCircle, LayoutDashboard, BarChart2, FileText, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, getDocs, onSnapshot, query, orderBy } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ReportDetailDialog } from "@/components/admin/report-detail-dialog.jsx";
import { EditCategoryDialog } from "@/components/admin/edit-category-dialog.jsx";
import AddReportDialog from "@/components/admin/add-report-dialog";
import LogoutConfirmationModal from "@/components/admin/LogoutConfirmationModal";
import Sidebar from "@/components/admin/Sidebar";
import ReportList from "@/components/admin/ReportList";
import { db } from "@/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getUserBarangay, isUserAdmin } from "@/lib/userMapping";
import { updateReportStatus, formatReportForDisplay } from "@/lib/reportUtils";
import { reverseGeocode } from "@/lib/mapUtils";

export default function ReportsPageClient() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hotspots, setHotspots] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const router = useRouter();
  const { user } = useCurrentUser();

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("DateTime", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);
    });
    return () => unsubscribe();
  }, []);

const userEmail = user?.email || "";
const userBarangay = getUserBarangay(userEmail);
const isAdmin = isUserAdmin(userEmail);
console.log("👤 Reports page - Current user:", user);
  console.log("📧 Reports page - User email:", userEmail);
  console.log("🏘️ Reports page - Mapped barangay:", userBarangay);
  console.log("🔐 Reports page - Is admin:", isAdmin);
  console.log("📊 Reports page - Total reports loaded:", reports.length);

  const calculateBarangayHotspots = (reports, barangay) => {
    if (!barangay || !reports.length) return [];
    
    const barangayReports = reports.filter(r => r.Barangay === barangay);
    console.log("🔍 Barangay reports for hotspot calculation:", barangayReports);

    const verifiedReports = barangayReports.filter(r => r.Status === 'Verified');
    console.log("✅ Verified reports for hotspot calculation:", verifiedReports.length);

    const gridSize = 0.002; 
    const locations = {};
    
    verifiedReports.forEach(report => {
      if (report.Latitude && report.Longitude) {
        
        const gridLat = Math.floor(report.Latitude / gridSize) * gridSize;
        const gridLng = Math.floor(report.Longitude / gridSize) * gridSize;
        const key = `${gridLat.toFixed(3)}_${gridLng.toFixed(3)}`;
        
        console.log(`📍 Report ${report.id}: Lat=${report.Latitude}, Lng=${report.Longitude} → Grid=${key}`);
        
        if (!locations[key]) {
          locations[key] = {
            lat: gridLat + (gridSize / 2), 
            lng: gridLng + (gridSize / 2),
            incidents: [],
            count: 0
          };
        }
        
        locations[key].incidents.push(report);
        locations[key].count++;
      } else {
        console.log(`❌ Report ${report.id}: Missing coordinates - Lat=${report.Latitude}, Lng=${report.Longitude}`);
      }
    });
    
    console.log("🗂️ Grid locations:", locations);

    const hotspotThreshold = 2; 
    const hotspots = Object.values(locations)
      .filter(location => location.count >= hotspotThreshold)
      .map(location => ({
        lat: location.lat,
        lng: location.lng,
        incidentCount: location.count,

        riskLevel: location.count >= 5 ? 'high' : location.count >= 3 ? 'medium' : 'low',
        incidents: location.incidents,
        radius: Math.min(location.count * 50, 200) 
      }))
      .sort((a, b) => b.incidentCount - a.incidentCount); 
    
    console.log("🔥 Final hotspots:", hotspots);
    return hotspots;
  };

  useEffect(() => {
    if (userBarangay && reports.length > 0) {
      const calculatedHotspots = calculateBarangayHotspots(reports, userBarangay);
      setHotspots(calculatedHotspots);
      console.log("🔥 Hotspots calculated for", userBarangay, ":", calculatedHotspots);
    } else {
      setHotspots([]);
    }
  }, [reports, userBarangay]);

  console.log("📊 Reports page - Total reports loaded:", reports.length);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const searchTerm = search.trim().toLowerCase();
      const matchesSearch =
        report?.id?.toString?.().toLowerCase?.().includes(searchTerm) ||
        report?.IncidentType?.toString?.().toLowerCase?.().includes(searchTerm) ||
        report?.Description?.toString?.().toLowerCase?.().includes(searchTerm) ||
        report?.Barangay?.toString?.().toLowerCase?.().includes(searchTerm);

      const normalizedStatus = (report?.Status ?? "").toString().toLowerCase().trim();
      const effectiveStatus = normalizedStatus || "pending";
      const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;

      const matchesBarangay = userBarangay ? report?.Barangay === userBarangay : false;

      const canViewSensitive = isAdmin || !report?.isSensitive;

      if (report?.id) {
        console.log(`🔍 Report ${report.id}: Barangay="${report?.Barangay}" vs UserBarangay="${userBarangay}" = ${matchesBarangay}, Sensitive=${report?.isSensitive}, CanView=${canViewSensitive}`);
      }

      return matchesSearch && matchesStatus && matchesBarangay && canViewSensitive;
    }).sort((a, b) => {
      // Sort by DateTime in descending order (latest first)
      const dateA = a.DateTime ? new Date(a.DateTime.seconds ? a.DateTime.seconds * 1000 : a.DateTime) : new Date(0);
      const dateB = b.DateTime ? new Date(b.DateTime.seconds ? b.DateTime.seconds * 1000 : b.DateTime) : new Date(0);
      return dateB - dateA;
    });
  }, [reports, search, statusFilter, userBarangay, isAdmin]);

  console.log("🔍 Reports page - Filtered reports count:", filteredReports.length);
  console.log("🔍 Reports page - All reports:", reports.map(r => ({ id: r.id, barangay: r.Barangay, status: r.Status })));
  console.log("🔍 Reports page - Filtered reports:", filteredReports.map(r => ({ id: r.id, barangay: r.Barangay, status: r.Status })));

  const handleVerify = async (id) => {
    const success = await updateReportStatus(id, "Verified");
    if (success) {
      
      console.log("Report verified successfully");
    }
  };

  const handleReject = async (id, reason) => {
    const success = await updateReportStatus(id, "Rejected", reason);
    if (success) {
      
      console.log("Report rejected successfully");
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/"); 
  };

  const handleGenerateMonthlyReport = async () => {
    if (isGeneratingReport) return;
    
    try {
      setIsGeneratingReport(true);
      
      // Check if we have data loaded from Firebase
      if (!reports || reports.length === 0) {
        alert('Reports are still loading from Firebase. Please wait a moment and try again.');
        return;
      }

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      
      console.log(`🗓️ Generating report for: ${monthNames[currentMonth - 1]} ${currentYear} (Month: ${currentMonth})`);
      console.log(`📊 Total reports available from Firebase:`, reports.length);
      console.log(`🏘️ User barangay:`, userBarangay);

      if (!userBarangay) {
        alert('Unable to generate report: No barangay assigned to your account. Please contact admin.');
        return;
      }
      
      // Filter reports for current month and verified status from user's barangay
      const currentMonthReports = reports.filter(report => {
        // Handle Firebase Timestamp objects properly
        let reportDate;
        try {
          if (report.DateTime?.seconds) {
            // Firebase Timestamp format
            reportDate = new Date(report.DateTime.seconds * 1000);
          } else if (report.DateTime?.toDate && typeof report.DateTime.toDate === 'function') {
            // Firebase Timestamp object with toDate method
            reportDate = report.DateTime.toDate();
          } else if (report.DateTime) {
            // Regular date string or Date object
            reportDate = new Date(report.DateTime);
          } else {
            console.warn(`⚠️ Report ${report.id}: Invalid or missing DateTime`);
            return false;
          }
        } catch (error) {
          console.error(`❌ Report ${report.id}: Error parsing DateTime:`, error);
          return false;
        }
        
        // Validate date
        if (isNaN(reportDate.getTime())) {
          console.warn(`⚠️ Report ${report.id}: Invalid date format`);
          return false;
        }
        
        const reportMonth = reportDate.getMonth() + 1;
        const reportYear = reportDate.getFullYear();
        const isCurrentMonth = reportMonth === currentMonth && reportYear === currentYear;
        const isVerified = report.Status === 'Verified';
        const isFromUserBarangay = report.Barangay === userBarangay;
        
        console.log(`🔍 Report ${report.id}: Date=${reportDate.toLocaleDateString()}, Status=${report.Status}, Barangay=${report.Barangay} → Include: ${isCurrentMonth && isVerified && isFromUserBarangay}`);
        
        return isCurrentMonth && isVerified && isFromUserBarangay;
      });

      console.log(`✅ Found ${currentMonthReports.length} verified reports for ${monthNames[currentMonth - 1]} ${currentYear} in ${userBarangay}`);
      console.log('📋 Reports that will be included in monthly report:');
      currentMonthReports.forEach((report, i) => {
        console.log(`  ${i + 1}. ${report.IncidentType || 'No type'} - ${report.id} - Status: ${report.Status}`);
      });
      
      if (currentMonthReports.length === 0) {
        alert(`No verified reports found for ${monthNames[currentMonth - 1]} ${currentYear} in ${userBarangay}.\n\nThis could mean:\n• No reports were submitted this month\n• No reports have been verified yet\n• Reports are from other barangays`);
        return;
      }

      // Fetch street addresses for all reports with coordinates
      console.log('🗺️ Fetching street addresses for reports...');
      const reportsWithAddresses = await Promise.all(
        currentMonthReports.map(async (report) => {
          if (report.Latitude && report.Longitude) {
            try {
              const streetAddress = await reverseGeocode(report.Latitude, report.Longitude);
              return { ...report, _streetAddress: streetAddress };
            } catch (error) {
              console.error(`Failed to fetch address for report ${report.id}:`, error);
              return { ...report, _streetAddress: `${report.Latitude}, ${report.Longitude}` };
            }
          }
          return report;
        })
      );

      // Generate HTML content for monthly report
      const reportTitle = `Monthly Incident Reports - ${userBarangay}`;
      const reportSubtitle = `${monthNames[currentMonth - 1]} ${currentYear}`;
      
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportTitle}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              html, body {
                width: 100%;
                height: 100%;
                font-family: Arial, sans-serif;
                background: white;
                overflow: hidden;
              }
              
              .report-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                background: white;
                height: 100vh;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
              }
              
              .report-title {
                color: #F14B51;
                text-align: center;
                margin-bottom: 30px;
                font-size: 28px;
                font-weight: bold;
              }
              
              .report-subtitle {
                color: #F14B51;
                border-bottom: 2px solid #F14B51;
                padding-bottom: 5px;
                margin-bottom: 20px;
                font-size: 20px;
                font-weight: bold;
              }
              
              .report-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
              }
              
              .report-field {
                margin-bottom: 8px;
                line-height: 1.5;
              }
              
              .report-section {
                margin-bottom: 20px;
              }
              
              .description-box {
                border: 1px solid #ddd;
                padding: 15px;
                background-color: #f9f9f9;
                border-radius: 4px;
                line-height: 1.6;
                word-wrap: break-word;
              }
              
              .footer {
                margin-top: auto;
                text-align: center;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #eee;
                padding-top: 20px;
                flex-shrink: 0;
              }
              
              .page-break {
                page-break-before: always;
                break-before: page;
              }
              
              @media print {
                html, body {
                  width: 210mm;
                  height: 297mm;
                  margin: 0;
                  padding: 0;
                  overflow: visible;
                }
                
                .report-container {
                  padding: 20mm;
                  margin: 0;
                  max-width: none;
                  width: 100%;
                  height: 257mm;
                  box-sizing: border-box;
                  page-break-after: always;
                  break-after: page;
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
                }
                
                .report-container:last-child {
                  page-break-after: avoid;
                  break-after: avoid;
                }
                
                .report-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                }
                
                .page-break {
                  page-break-before: always;
                  break-before: page;
                }
              }
            </style>
          </head>
          <body>
            ${reportsWithAddresses.map((report, index) => {
              // Handle different DateTime formats properly
              let reportDate;
              let formattedDate = 'Unknown Date';
              let formattedTime = 'Unknown Time';
              
              try {
                if (report.DateTime?.seconds) {
                  reportDate = new Date(report.DateTime.seconds * 1000);
                } else if (report.DateTime?.toDate && typeof report.DateTime.toDate === 'function') {
                  reportDate = report.DateTime.toDate();
                } else {
                  reportDate = new Date(report.DateTime);
                }
                
                if (reportDate && !isNaN(reportDate.getTime())) {
                  formattedDate = reportDate.toLocaleDateString();
                  formattedTime = reportDate.toLocaleTimeString();
                }
              } catch (error) {
                console.error('Error formatting date for report:', report.id, error);
              }
              
              return `
                <div class="report-container" style="${index === reportsWithAddresses.length - 1 ? 'page-break-after: avoid; break-after: avoid;' : 'page-break-after: always; break-after: page;'}">
                  <div style="text-align: right; color: #666; font-size: 12px; margin-bottom: 20px;">
                    ${monthNames[currentMonth - 1]} ${currentYear} - Report ${index + 1} of ${reportsWithAddresses.length}
                  </div>
                  
                  <h1 class="report-title">INCIDENT REPORT</h1>
                  
                  <div class="report-section">
                    <h2 class="report-subtitle">${report.IncidentType || report.Title || 'Untitled Report'}</h2>
                  </div>
                  
                  <div class="report-grid">
                    <div>
                      <div class="report-field"><strong>Date:</strong> ${formattedDate}</div>
                      <div class="report-field"><strong>Time:</strong> ${formattedTime}</div>
                      <div class="report-field"><strong>Location:</strong> ${report.Barangay || 'Not specified'}</div>
                    </div>
                    <div>
                      <div class="report-field"><strong>Status:</strong> Verified</div>
                      <div class="report-field"><strong>Submitted by:</strong> ${report.SubmittedByEmail || 'Anonymous'}</div>
                      <div class="report-field"><strong>Report ID:</strong> ${report.id}</div>
                    </div>
                  </div>
                  
                  <div class="report-section">
                    <h3 style="color: #F14B51; margin-bottom: 10px;">Description:</h3>
                    <div class="description-box">
                      ${report.Description || "No description provided"}
                    </div>
                  </div>
                  
                  ${report.Address ? `
                    <div class="report-section">
                      <h3 style="color: #F14B51; margin-bottom: 10px;">Address:</h3>
                      <div style="padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
                        ${report.Address}
                      </div>
                    </div>
                  ` : ''}
                  
                  ${report.Latitude && report.Longitude ? `
                    <div class="report-section">
                      <h3 style="color: #F14B51; margin-bottom: 10px;">Location Details:</h3>
                      <div style="padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
                        ${report._streetAddress || `${report.Latitude}, ${report.Longitude}`}
                      </div>
                    </div>
                  ` : ''}
                  
                  <div class="footer">
                    <div style="text-align: center; margin-bottom: 10px;">
                      <strong>${userBarangay} - Monthly Report</strong>
                    </div>
                    <div style="text-align: center;">
                      Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
            
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 100);

                setTimeout(function() {
                  window.close();
                }, 1000);
              }

              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 100);
              }
            </script>
          </body>
        </html>
      `;

      // Generate and open the report
      const blob = new Blob([printContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site to generate reports.');
        URL.revokeObjectURL(url);
        return;
      }

      console.log(`📄 Monthly report generated successfully with ${currentMonthReports.length} pages (1 page per report)`);

      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
      
    } catch (error) {
      console.error('❌ Error generating monthly report:', error);
      alert(`Error generating monthly report: ${error.message}\n\nPlease check the console for more details and try again.`);
    } finally {
      setIsGeneratingReport(false);
    }
  };



  return (
    <>
      <div className="flex min-h-screen bg-white">
        {}
        <Sidebar onLogout={() => setShowLogoutModal(true)} />
        {}
        <main className="flex-1 ml-64 p-10 bg-white min-h-screen">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-red-600">Manage Reports</h1>
            <div className="flex gap-4">
              <button
                className={`font-medium rounded-lg px-6 py-2 text-base transition-colors ${
                  isGeneratingReport
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
                onClick={handleGenerateMonthlyReport}
                disabled={isGeneratingReport}
                title={isGeneratingReport ? 'Generating report...' : 'Generate printable report for current month'}
              >
                {isGeneratingReport ? 'Generating...' : 'Generate Monthly Report'}
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-6 py-2 text-base transition-colors"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Edit Categories
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-6 py-2 text-base transition-colors"
                onClick={() => setShowAddReport(true)}
              >
                Add Report
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex items-center bg-white border rounded-lg px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search Reports"
                className="flex-1 outline-none bg-transparent text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border rounded-lg px-4 py-2 text-base text-gray-700 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-red-600 mb-1">
              {userBarangay ? `${userBarangay} Reports` : "No Reports"}
            </h2>
            <p className="text-gray-400 mb-6">
              {userBarangay
                ? `Showing incident reports for barangay: ${userBarangay}`
                : "No reports available for your account. Please contact admin if you think this is an error."}
            </p>
            {userBarangay ? (
              <>
                <ReportList
                  key={`${search}-${statusFilter}-${userBarangay}`}
                  reports={filteredReports}
                  onVerify={handleVerify}
                  onReject={handleReject}
                  onViewDetails={(report) => {
                    setSelectedReport(report);
                    setIsDialogOpen(true);
                  }}
                  statusFilter={statusFilter}
                  reportsPerPage={6} 
                />
              </>
            ) : (
              <div className="text-center text-gray-500 py-10">No reports to show.</div>
            )}
            <ReportDetailDialog
              report={selectedReport}
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onVerify={handleVerify}
              onReject={handleReject}
              onDelete={(reportId) => {
                
                console.log("Report deleted successfully");
              }}
              onEdit={(reportId, updates) => {
                
                console.log("Report edited successfully");
              }}
            />
            <EditCategoryDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              categories={categories}
              onSave={({ name, keywords }) => {
                setCategories((prev) => [...prev, { name, keywords }]);
              }}
              onDelete={(categoryName) => {
                setCategories((prev) => prev.filter(cat => (cat.name || cat) !== categoryName));
              }}
            />
          </div>
        </main>
      </div>
      <AddReportDialog 
        open={showAddReport} 
        onClose={() => setShowAddReport(false)} 
        barangay={userBarangay}
        categories={categories}
      />
      <LogoutConfirmationModal
        open={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}

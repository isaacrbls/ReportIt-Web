import { RecentReports } from "./recent-reports";

export default function ReportList({ reports, onVerify, onReject, onViewDetails, statusFilter }) {
  if (!Array.isArray(reports)) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      {reports.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No reports found for this barangay.</div>
      ) : (
        reports.map((report) => (
          <div key={report.id}>
            <RecentReports
              singleReport={report}
              onVerify={onVerify}
              onReject={onReject}
              onViewDetails={onViewDetails}
              statusFilter={statusFilter}
            />
          </div>
        ))
      )}
    </div>
  );
}

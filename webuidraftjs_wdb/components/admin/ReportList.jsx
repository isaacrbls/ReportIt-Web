import { RecentReports } from "./recent-reports";

export default function ReportList({ reports, onVerify, onReject, onViewDetails, statusFilter }) {
  if (!Array.isArray(reports)) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      {reports.length === 0 ? (
        <RecentReports singleReport={null} onVerify={onVerify} onReject={onReject} onViewDetails={onViewDetails} statusFilter={statusFilter} />
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

import { RecentReports } from "./recent-reports";

export default function ReportList({ reports, onVerify, onReject, onViewDetails }) {
  // Reuse the RecentReports UI for each report, but allow for custom actions
  return (
    <div className="flex flex-col gap-4">
      {reports.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No reports found</div>
      ) : (
        reports.map((report) => (
          <div key={report.id}>
            <RecentReports
              singleReport={report}
              onVerify={onVerify}
              onReject={onReject}
              onViewDetails={onViewDetails}
            />
          </div>
        ))
      )}
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { RecentReports } from "./recent-reports";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ReportList({ 
  reports, 
  onVerify, 
  onReject, 
  onViewDetails, 
  statusFilter,
  reportsPerPage = 5 
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    if (!Array.isArray(reports)) {
      return {
        totalReports: 0,
        totalPages: 0,
        currentReports: [],
        startIndex: 0,
        endIndex: 0
      };
    }

    const totalReports = reports.length;
    const totalPages = Math.ceil(totalReports / reportsPerPage);
    const startIndex = (currentPage - 1) * reportsPerPage;
    const endIndex = Math.min(startIndex + reportsPerPage, totalReports);
    const currentReports = reports.slice(startIndex, endIndex);

    return {
      totalReports,
      totalPages,
      currentReports,
      startIndex: startIndex + 1, 
      endIndex
    };
  }, [reports, currentPage, reportsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [reports?.length, statusFilter]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, paginationData.totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getVisiblePages = () => {
    const totalPages = paginationData.totalPages;
    const current = currentPage;
    const pages = [];

    if (totalPages <= 7) {
      
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      
      pages.push(1);

      if (current > 4) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (current < totalPages - 3) {
        pages.push('...');
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (!Array.isArray(reports)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {}
      {paginationData.totalReports === 0 ? (
        <div className="text-center text-gray-500 py-10">No reports found for this barangay.</div>
      ) : (
        <>
          {}
          <div className="flex justify-between items-center text-sm text-gray-600 px-1 mb-2">
            <span>
              Showing {paginationData.startIndex}-{paginationData.endIndex} of {paginationData.totalReports} reports
            </span>
            {paginationData.totalPages > 1 && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                Page {currentPage} of {paginationData.totalPages}
              </span>
            )}
          </div>

          {}
          {paginationData.currentReports.map((report) => (
            <div key={report.id}>
              <RecentReports
                singleReport={report}
                onVerify={onVerify}
                onReject={onReject}
                onViewDetails={onViewDetails}
                statusFilter={statusFilter}
              />
            </div>
          ))}

          {}
          {paginationData.totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                {}
                <div className="flex items-center gap-1">
                  {getVisiblePages().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageClick(page)}
                        className={`w-9 h-9 p-0 ${
                          currentPage === page 
                            ? "bg-red-500 text-white hover:bg-red-600 border-red-500" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                {}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === paginationData.totalPages}
                  className="flex items-center gap-1 px-3 border-red-400 text-red-500 hover:bg-red-50"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {}
          {paginationData.totalPages > 1 && (
            <div className="text-center text-xs text-gray-500 mt-2">
              Scroll up to see more reports on previous pages
            </div>
          )}
        </>
      )}
    </div>
  );
}

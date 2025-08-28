import { getReportDetails } from "./reportUtils";

// Test function to demonstrate Firebase integration
export async function testFetchReport() {
  console.log("Testing Firebase report fetch...");
  
  // Using the report ID from your screenshot
  const reportId = "CykT1QjWDzKxHiQDfsK";
  
  try {
    const reportData = await getReportDetails(reportId);
    
    if (reportData) {
      console.log("✅ Successfully fetched report:");
      console.log("ID:", reportData.id);
      console.log("Category:", reportData.category);
      console.log("Location:", reportData.location);
      console.log("Date:", reportData.date);
      console.log("Time:", reportData.time);
      console.log("Submitted by:", reportData.submittedBy);
      console.log("Status:", reportData.status);
      console.log("Description:", reportData.description);
    } else {
      console.log("❌ Report not found");
    }
  } catch (error) {
    console.error("❌ Error fetching report:", error);
  }
}

// Example usage in a React component
export function ExampleReportComponent() {
  const [reportData, setReportData] = useState(null);
  
  useEffect(() => {
    async function fetchReport() {
      const data = await getReportDetails("CykT1QjWDzKxHiQDfsK");
      setReportData(data);
    }
    
    fetchReport();
  }, []);
  
  if (!reportData) {
    return <div>Loading report...</div>;
  }
  
  return (
    <div>
      <h2>{reportData.category}</h2>
      <p>Location: {reportData.location}</p>
      <p>Date: {reportData.date} at {reportData.time}</p>
      <p>Submitted by: {reportData.submittedBy}</p>
      <p>Status: {reportData.status}</p>
      <p>Description: {reportData.description}</p>
    </div>
  );
}

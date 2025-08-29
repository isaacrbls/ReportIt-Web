// Debug script to check reports in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAPYNvKhQwgdLvKAGFp9gx1FHqRy-KXnqA",
  authDomain: "admin-76567.firebaseapp.com",
  projectId: "admin-76567",
  storageBucket: "admin-76567.appspot.com",
  messagingSenderId: "831728802398",
  appId: "1:831728802398:web:5c2c3dc59b7e01b1c6cf5a",
  measurementId: "G-EEGS32HDC8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkReports() {
  try {
    console.log("🔍 Checking reports in Firestore...");
    const querySnapshot = await getDocs(collection(db, "reports"));
    
    if (querySnapshot.empty) {
      console.log("❌ No reports found in the database");
      return;
    }
    
    console.log(`✅ Found ${querySnapshot.size} reports:`);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n📄 Report ID: ${doc.id}`);
      console.log(`   🏘️ Barangay: ${data.Barangay || 'Not set'}`);
      console.log(`   📝 Type: ${data.IncidentType || 'Not set'}`);
      console.log(`   📧 Submitted by: ${data.SubmittedByEmail || 'Not set'}`);
      console.log(`   📊 Status: ${data.Status || 'Not set'}`);
      console.log(`   📅 DateTime: ${data.DateTime ? new Date(data.DateTime.seconds * 1000).toLocaleString() : 'Not set'}`);
    });
  } catch (error) {
    console.error("❌ Error checking reports:", error);
  }
}

checkReports();

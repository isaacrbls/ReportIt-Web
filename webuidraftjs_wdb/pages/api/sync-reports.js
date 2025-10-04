// API to sync reports between Firebase and Django
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { direction, reportId, reportData } = req.body;
  // direction: 'firebase-to-django' | 'django-to-firebase' | 'bidirectional'
  
  try {
    let syncResult = { success: false, message: '', details: {} };

    if (direction === 'firebase-to-django' || direction === 'bidirectional') {
      // Sync Firebase report to Django
      try {
        const djangoPayload = {
          title: reportData.Title || '',
          incident_type: reportData.IncidentType || '',
          description: reportData.Description || '',
          barangay: reportData.Barangay || '',
          latitude: reportData.Latitude,
          longitude: reportData.Longitude,
          media_url: reportData.MediaURL || '',
          media_type: reportData.MediaType || '',
          status: reportData.Status || 'Pending',
          submitted_by_email: reportData.SubmittedByEmail || '',
          is_sensitive: reportData.isSensitive || false
        };

        const response = await fetch('http://127.0.0.1:8000/api/reports/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || ''
          },
          body: JSON.stringify(djangoPayload)
        });

        if (response.ok) {
          const djangoReport = await response.json();
          syncResult.details.django = {
            success: true,
            id: djangoReport.id,
            message: 'Synced to Django successfully'
          };
        } else {
          syncResult.details.django = {
            success: false,
            message: `Django sync failed: ${response.status}`
          };
        }
      } catch (error) {
        syncResult.details.django = {
          success: false,
          message: `Django sync error: ${error.message}`
        };
      }
    }

    if (direction === 'django-to-firebase' || direction === 'bidirectional') {
      // This would require Firebase Admin SDK for server-side operations
      syncResult.details.firebase = {
        success: false,
        message: 'Django to Firebase sync requires Firebase Admin SDK setup'
      };
    }

    // Determine overall success
    if (direction === 'firebase-to-django') {
      syncResult.success = syncResult.details.django?.success || false;
      syncResult.message = syncResult.details.django?.message || 'Sync failed';
    } else if (direction === 'bidirectional') {
      const djangoOk = syncResult.details.django?.success || false;
      const firebaseOk = syncResult.details.firebase?.success || false;
      syncResult.success = djangoOk; // For now, just check Django
      syncResult.message = `Django: ${syncResult.details.django?.message}, Firebase: ${syncResult.details.firebase?.message}`;
    }

    res.status(200).json(syncResult);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sync operation failed', 
      error: error.message 
    });
  }
}
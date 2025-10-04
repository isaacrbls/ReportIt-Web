export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // Fetch analytics from Django backend
    const djangoResponse = await fetch('http://127.0.0.1:8000/api/analytics/stats/', {
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json'
      }
    });

    if (djangoResponse.ok) {
      const djangoStats = await djangoResponse.json();
      res.status(200).json({
        source: 'django',
        data: djangoStats,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(200).json({
        source: 'fallback',
        data: {
          total_reports: 0,
          pending_reports: 0,
          verified_reports: 0,
          message: 'Django backend unavailable'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(200).json({
      source: 'error',
      data: {
        total_reports: 0,
        pending_reports: 0,
        verified_reports: 0,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
}
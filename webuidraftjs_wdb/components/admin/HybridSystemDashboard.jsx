"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHybridReports } from '@/contexts/HybridReportsContext';
import apiClient from '@/lib/apiClient';

export default function HybridSystemDashboard() {
  const { 
    useFirebase, 
    toggleDataSource, 
    getHybridStats, 
    getUniformReports 
  } = useHybridReports();
  
  const [stats, setStats] = useState(null);
  const [djangoStatus, setDjangoStatus] = useState('unknown');
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check Django backend status
      const response = await fetch('http://127.0.0.1:8000/api/analytics/stats/');
      setDjangoStatus(response.ok ? 'online' : 'offline');
      
      // Get hybrid stats
      const hybridStats = await getHybridStats();
      setStats(hybridStats);
    } catch (error) {
      setDjangoStatus('offline');
      console.error('System status check failed:', error);
    }
  };

  const syncReportsToBackend = async () => {
    setSyncInProgress(true);
    try {
      const reports = getUniformReports();
      let successCount = 0;
      
      for (const report of reports) {
        try {
          await fetch('/api/sync-reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              direction: 'firebase-to-django',
              reportId: report.id,
              reportData: report.firebase_data
            })
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to sync report ${report.id}:`, error);
        }
      }
      
      alert(`Synced ${successCount} of ${reports.length} reports to Django backend`);
      await checkSystemStatus();
    } catch (error) {
      console.error('Bulk sync failed:', error);
      alert('Sync operation failed');
    } finally {
      setSyncInProgress(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Hybrid System Management</h2>
        <Button onClick={checkSystemStatus} variant="outline">
          Refresh Status
        </Button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Firebase Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-100 text-green-800">Online</Badge>
            <p className="text-xs text-gray-600 mt-1">Primary data source</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Django Backend</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={djangoStatus === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {djangoStatus === 'online' ? 'Online' : 'Offline'}
            </Badge>
            <p className="text-xs text-gray-600 mt-1">Secondary sync target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={useFirebase ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
              {useFirebase ? 'Firebase Primary' : 'Django Primary'}
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2 text-xs"
              onClick={() => toggleDataSource(!useFirebase)}
            >
              Switch Mode
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Firebase Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Reports:</span>
                  <span className="font-semibold">{stats.firebase?.total_reports || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-semibold">{stats.firebase?.pending_reports || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verified:</span>
                  <span className="font-semibold">{stats.firebase?.verified_reports || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Django Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.django ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Reports:</span>
                    <span className="font-semibold">{stats.django.total_reports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="font-semibold">{stats.django.pending_reports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified:</span>
                    <span className="font-semibold">{stats.django.verified_reports}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Django backend unavailable</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Data Synchronization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sync Firebase to Django</h4>
                <p className="text-sm text-gray-600">Copy all Firebase reports to Django backend</p>
              </div>
              <Button 
                onClick={syncReportsToBackend}
                disabled={syncInProgress || djangoStatus !== 'online'}
                className="ml-4"
              >
                {syncInProgress ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
            
            {djangoStatus !== 'online' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  ⚠️ Django backend is offline. Start the Django server to enable syncing.
                </p>
                <code className="text-xs text-gray-600 block mt-1">
                  python manage.py runserver
                </code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Available API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm">POST /api/verify-captcha</span>
              <Badge variant="outline">Node.js + Django</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm">POST /api/forgot-password</span>
              <Badge variant="outline">Node.js + Django</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm">GET /api/analytics</span>
              <Badge variant="outline">Node.js → Django</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm">POST /api/sync-reports</span>
              <Badge variant="outline">Node.js</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm">Django REST API</span>
              <Badge className="bg-green-100 text-green-800">Direct</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Alert {
  _id: string;
  type: 'error' | 'warning' | 'info';
  category: 'system' | 'bet' | 'match' | 'user' | 'payment';
  title: string;
  message: string;
  details: any;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export default function MonitoringAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unacknowledged');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
    
    // Set up polling for new alerts
    const interval = setInterval(fetchAlerts, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [filter, categoryFilter]);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/admin/monitoring-alerts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/acknowledge-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ alertId }),
      });

      if (response.ok) {
        await fetchAlerts(); // Refresh alerts
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const acknowledgeAll = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/acknowledge-all-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchAlerts(); // Refresh alerts
      }
    } catch (err) {
      console.error('Error acknowledging all alerts:', err);
    }
  };

  const getAlertIcon = (type: string, category: string) => {
    if (type === 'error') return '🚨';
    if (type === 'warning') return '⚠️';
    
    switch (category) {
      case 'system': return '🔧';
      case 'bet': return '💰';
      case 'match': return '🎯';
      case 'user': return '👤';
      case 'payment': return '💳';
      default: return 'ℹ️';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-100 border-blue-200 text-blue-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  if (loading) {
    return (
      <AdminLayout title="Monitoring Alerts">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Monitoring Alerts">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-black">System Monitoring</h1>
              <p className="text-gray-600 mt-1">
                Monitor system health and critical events
              </p>
            </div>
            {unacknowledgedCount > 0 && (
              <div className="flex items-center space-x-4">
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  {unacknowledgedCount} New Alert{unacknowledgedCount !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={acknowledgeAll}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Acknowledge All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="unacknowledged">Unacknowledged</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="all">All Alerts</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Categories</option>
                <option value="system">System</option>
                <option value="bet">Betting</option>
                <option value="match">Matches</option>
                <option value="user">Users</option>
                <option value="payment">Payments</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert._id} className={`border rounded-lg p-4 ${getAlertColor(alert.type)} ${
              !alert.acknowledged ? 'shadow-lg' : 'opacity-75'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {getAlertIcon(alert.type, alert.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                        {alert.category.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{alert.message}</p>
                    
                    {alert.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer">Show Details</summary>
                        <pre className="mt-2 p-2 bg-white bg-opacity-30 rounded text-xs overflow-x-auto">
                          {JSON.stringify(alert.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    <div className="text-xs mt-2 opacity-75">
                      <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.acknowledged && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Acknowledged: {new Date(alert.acknowledgedAt!).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert._id)}
                    className="bg-white bg-opacity-30 hover:bg-opacity-50 px-3 py-1 rounded text-sm"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {alerts.length === 0 && (
            <div className="bg-white text-black shadow rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
              <p className="text-gray-600">
                No alerts found for the selected filters.
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white text-black shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🚨</div>
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.type === 'error' && !a.acknowledged).length}
              </div>
              <div className="text-sm text-gray-600">Critical Errors</div>
            </div>
          </div>
          
          <div className="bg-white text-black shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <div className="text-2xl font-bold text-yellow-600">
                {alerts.filter(a => a.type === 'warning' && !a.acknowledged).length}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </div>
          
          <div className="bg-white text-black shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-blue-600">
                {alerts.filter(a => (a.category === 'bet' || a.category === 'payment') && !a.acknowledged).length}
              </div>
              <div className="text-sm text-gray-600">Financial Alerts</div>
            </div>
          </div>
          
          <div className="bg-white text-black shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🔧</div>
              <div className="text-2xl font-bold text-purple-600">
                {alerts.filter(a => a.category === 'system' && !a.acknowledged).length}
              </div>
              <div className="text-sm text-gray-600">System Issues</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

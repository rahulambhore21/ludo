'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';

interface MaintenanceSettings {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  estimatedEndTime?: string;
  lastUpdatedBy?: string;
  updatedAt?: string;
}

export default function AdminMaintenance() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    isMaintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
    estimatedEndTime: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMaintenanceSettings();
  }, []);

  const fetchMaintenanceSettings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/maintenance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching maintenance settings:', err);
      setError('Failed to load maintenance settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess('Maintenance settings updated successfully');
        fetchMaintenanceSettings(); // Refresh data
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Maintenance Mode">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Maintenance Mode">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white text-black shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">System Maintenance</h1>
              <p className="text-gray-600 mt-1">
                Control system-wide maintenance mode for updates and error fixes
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              settings.isMaintenanceMode 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {settings.isMaintenanceMode ? '🔧 Maintenance Active' : '✅ System Online'}
            </div>
          </div>
        </div>

        {/* Maintenance Settings */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Maintenance Settings</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="space-y-6">
            {/* Maintenance Toggle */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-black">Enable Maintenance Mode</h3>
                <p className="text-sm text-gray-600">
                  When enabled, users will see a maintenance message and cannot access the system
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.isMaintenanceMode}
                  onChange={(e) => setSettings({
                    ...settings,
                    isMaintenanceMode: e.target.checked
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Maintenance Message */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Maintenance Message
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings({
                  ...settings,
                  maintenanceMessage: e.target.value
                })}
                placeholder="Enter message to display during maintenance..."
              />
            </div>

            {/* Estimated End Time */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Estimated End Time (Optional)
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.estimatedEndTime || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  estimatedEndTime: e.target.value
                })}
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: When maintenance is expected to end
              </p>
            </div>

            {/* Last Updated Info */}
            {settings.lastUpdatedBy && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-black mb-2">Last Updated</h4>
                <p className="text-sm text-gray-600">
                  By: {settings.lastUpdatedBy}
                </p>
                <p className="text-sm text-gray-600">
                  At: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Unknown'}
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Warning Notice */}
        {settings.isMaintenanceMode && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Maintenance Mode is Active</h3>
                <p className="mt-1 text-sm">
                  Users are currently seeing the maintenance message and cannot access the system.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Zap, Play, Pause, Trash2, Loader2, MessageSquare, Calendar, Bell, RefreshCw } from 'lucide-react';
import { automationAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt: string | null;
  config: any;
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    loadRules();
    loadTemplates();
  }, []);

  const loadRules = async () => {
    try {
      const response = await automationAPI.getAll();
      setRules(response.data.data);
    } catch (error) {
      toast.error('Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await automationAPI.getTemplates();
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await automationAPI.toggle(id);
      toast.success('Automation rule toggled');
      loadRules();
    } catch (error) {
      toast.error('Failed to toggle rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;

    try {
      await automationAPI.delete(id);
      toast.success('Automation rule deleted');
      loadRules();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      await automationAPI.createFromTemplate(templateId);
      toast.success('Automation rule created from template');
      setShowTemplatesModal(false);
      loadRules();
    } catch (error) {
      toast.error('Failed to create from template');
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'NEW_CONTACT':
        return <MessageSquare className="w-5 h-5" />;
      case 'BOOKING_CREATED':
        return <Calendar className="w-5 h-5" />;
      case 'BOOKING_REMINDER':
        return <Bell className="w-5 h-5" />;
      case 'INVENTORY_LOW':
        return <RefreshCw className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getTriggerLabel = (trigger: string) => {
    return trigger.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getActionBadge = (action: string) => {
    const colors: any = {
      SEND_EMAIL: 'bg-blue-100 text-blue-800',
      SEND_SMS: 'bg-green-100 text-green-800',
      CREATE_ALERT: 'bg-yellow-100 text-yellow-800',
      UPDATE_STATUS: 'bg-purple-100 text-purple-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <toast.ToastContainer />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
            <p className="text-gray-600 mt-1">Automate your workflows and save time</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Use Template
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Rule
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Rules</p>
            <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {rules.filter((r) => r.isActive).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Inactive</p>
            <p className="text-2xl font-bold text-gray-400">
              {rules.filter((r) => !r.isActive).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Executions</p>
            <p className="text-2xl font-bold text-primary-600">
              {rules.reduce((sum, r) => sum + r.executionCount, 0)}
            </p>
          </div>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No automation rules yet</h3>
              <p className="text-gray-600 mb-4">Create your first automation rule to get started</p>
              <button
                onClick={() => setShowTemplatesModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Browse Templates
              </button>
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        rule.isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {getTriggerIcon(rule.trigger)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rule.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Trigger:</span>
                          <span className="font-medium text-gray-900">
                            {getTriggerLabel(rule.trigger)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Action:</span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${getActionBadge(
                              rule.action
                            )}`}
                          >
                            {rule.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Executed:</span>
                          <span className="font-medium text-gray-900">{rule.executionCount}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(rule.id)}
                      className={`p-2 rounded-lg transition ${
                        rule.isActive
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                      title={rule.isActive ? 'Pause' : 'Activate'}
                    >
                      {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Templates Modal */}
        {showTemplatesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Automation Templates</h2>
                <button
                  onClick={() => setShowTemplatesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <div className="flex gap-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {getTriggerLabel(template.trigger)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {template.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCreateFromTemplate(template.id)}
                        className="ml-4 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
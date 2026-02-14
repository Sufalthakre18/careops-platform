'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import { automationAPI } from '@/lib/api';
import { handleApiError } from '@/lib/utils';
import { 
  Plus, Zap, Play, Pause, Trash2, MessageSquare, 
  Calendar, Bell, RefreshCw, Edit, FileText, Package 
} from 'lucide-react';

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
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger: 'NEW_CONTACT',
    action: 'SEND_EMAIL',
    config: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesRes, templatesRes] = await Promise.all([
        automationAPI.getAll(),
        automationAPI.getTemplates(),
      ]);
      setRules(rulesRes.data.data);
      setTemplates(templatesRes.data.data);
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await automationAPI.create(newRule);
      setAlert({ type: 'success', message: 'Automation rule created!' });
      setShowCreateModal(false);
      setNewRule({
        name: '',
        description: '',
        trigger: 'NEW_CONTACT',
        action: 'SEND_EMAIL',
        config: {},
      });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await automationAPI.toggle(id);
      setAlert({ type: 'success', message: 'Rule toggled successfully!' });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this automation rule?')) return;
    try {
      await automationAPI.delete(id);
      setAlert({ type: 'success', message: 'Rule deleted!' });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      await automationAPI.createFromTemplate(templateId);
      setAlert({ type: 'success', message: 'Rule created from template!' });
      setShowTemplatesModal(false);
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const getTriggerIcon = (trigger: string) => {
    const icons: any = {
      NEW_CONTACT: MessageSquare,
      BOOKING_CREATED: Calendar,
      BOOKING_REMINDER: Bell,
      FORM_PENDING: FileText,
      FORM_OVERDUE: FileText,
      INVENTORY_LOW: Package,
    };
    const Icon = icons[trigger] || Zap;
    return <Icon className="w-5 h-5" />;
  };

  const getTriggerLabel = (trigger: string) => {
    return trigger.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionColor = (action: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      SEND_EMAIL: 'info',
      SEND_SMS: 'success',
      CREATE_ALERT: 'warning',
      UPDATE_STATUS: 'info',
    };
    return colors[action] || 'default';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
            <p className="text-gray-600 mt-1">Automate workflows and save time</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowTemplatesModal(true)}>
              <Zap className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </div>

        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-gray-600">Total Rules</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{rules.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {rules.filter(r => r.isActive).length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Inactive</p>
            <p className="text-2xl font-bold text-gray-400 mt-1">
              {rules.filter(r => !r.isActive).length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Total Executions</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">
              {rules.reduce((sum, r) => sum + r.executionCount, 0)}
            </p>
          </Card>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {rules.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No automation rules yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first automation to get started
                </p>
                <Button variant="primary" onClick={() => setShowTemplatesModal(true)}>
                  Browse Templates
                </Button>
              </div>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        rule.isActive
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {getTriggerIcon(rule.trigger)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                        <Badge variant={rule.isActive ? 'success' : 'default'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Trigger: </span>
                          <span className="font-medium text-gray-900">
                            {getTriggerLabel(rule.trigger)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Action: </span>
                          <Badge variant={getActionColor(rule.action)}>
                            {rule.action.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-500">Executed: </span>
                          <span className="font-medium text-gray-900">
                            {rule.executionCount}x
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={rule.isActive ? 'secondary' : 'primary'}
                      onClick={() => handleToggle(rule.id)}
                    >
                      {rule.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Automation Rule"
          footer={
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate}>
                Create Rule
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Rule Name"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              placeholder="Welcome Email"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Send welcome email to new contacts"
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger
              </label>
              <select
                className="input"
                value={newRule.trigger}
                onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
              >
                <option value="NEW_CONTACT">New Contact</option>
                <option value="BOOKING_CREATED">Booking Created</option>
                <option value="BOOKING_REMINDER">Booking Reminder</option>
                <option value="FORM_PENDING">Form Pending</option>
                <option value="FORM_OVERDUE">Form Overdue</option>
                <option value="INVENTORY_LOW">Inventory Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                className="input"
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
              >
                <option value="SEND_EMAIL">Send Email</option>
                <option value="SEND_SMS">Send SMS</option>
                <option value="CREATE_ALERT">Create Alert</option>
                <option value="UPDATE_STATUS">Update Status</option>
              </select>
            </div>
          </form>
        </Modal>

        {/* Templates Modal */}
        <Modal
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          title="Automation Templates"
          size="lg"
        >
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="default">{getTriggerLabel(template.trigger)}</Badge>
                      <Badge variant={getActionColor(template.action)}>
                        {template.action.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleCreateFromTemplate(template.id)}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
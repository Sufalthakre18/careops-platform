'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { integrationAPI } from '@/lib/api';
import { handleApiError } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Mail, MessageSquare, Calendar, Webhook, CheckCircle, XCircle } from 'lucide-react';

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [emailData, setEmailData] = useState({
    apiKey: '',
    fromEmail: '',
    fromName: '',
  });

  const [smsData, setSmsData] = useState({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
  });

  const [webhookData, setWebhookData] = useState({
    url: '',
    events: [] as string[],
    secret: '',
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await integrationAPI.getAll();
      let loadedIntegrations = response.data.data;

      // Add built-in calendar integration if not present
      const hasCalendar = loadedIntegrations.some((i:any) => i.type === 'CALENDAR');
      if (!hasCalendar) {
        loadedIntegrations = [
          ...loadedIntegrations,
          {
            id: 'built-in-calendar',
            type: 'CALENDAR',
            provider: 'Built-in',
            status: 'CONNECTED',
            config: {},
            lastSyncAt: null,
            errorMessage: null,
          }
        ];
      }

      setIntegrations(loadedIntegrations);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const existing = integrations.find(i => i.type === 'EMAIL');
      if (existing) {
        await integrationAPI.updateEmail(existing.id, emailData);
        setAlert({ type: 'success', message: 'Email integration updated!' });
      } else {
        await integrationAPI.createEmail({ type: 'EMAIL', provider: 'RESEND', ...emailData });
        setAlert({ type: 'success', message: 'Email integration added!' });
      }
      setShowEmailModal(false);
      resetEmailForm();
      loadIntegrations();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleSMSSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await integrationAPI.createSms({ type: 'SMS', provider: 'TWILIO', ...smsData });
      setAlert({ type: 'success', message: 'SMS integration added!' });
      setShowSMSModal(false);
      resetSMSForm();
      loadIntegrations();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleWebhookSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await integrationAPI.createWebhook({ type: 'WEBHOOK', ...webhookData });
      setAlert({ type: 'success', message: 'Webhook added!' });
      setShowWebhookModal(false);
      resetWebhookForm();
      loadIntegrations();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleTest = async (id: string) => {
    if (id === 'built-in-calendar') {
      // No test needed, just navigate
      router.push('/integration/calendar');
      return;
    }
    try {
      await integrationAPI.testConnection(id);
      setAlert({ type: 'success', message: 'Connection test successful!' });
      loadIntegrations();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleRemove = async (id: string) => {
    if (id === 'built-in-calendar') {
      // Built-in calendar cannot be removed
      setAlert({ type: 'error', message: 'Built-in calendar cannot be removed.' });
      return;
    }
    if (!confirm('Are you sure you want to remove this integration?')) return;

    try {
      await integrationAPI.delete(id);
      setAlert({ type: 'success', message: 'Integration removed!' });
      loadIntegrations();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const resetEmailForm = () => {
    setEmailData({
      apiKey: '',
      fromEmail: '',
      fromName: '',
    });
  };

  const resetSMSForm = () => {
    setSmsData({
      accountSid: '',
      authToken: '',
      phoneNumber: '',
    });
  };

  const resetWebhookForm = () => {
    setWebhookData({
      url: '',
      events: [],
      secret: '',
    });
  };

  const openEmailModal = () => {
    const existing = integrations.find(i => i.type === 'EMAIL');
    if (existing) {
      setEmailData({
        apiKey: existing.config?.apiKey || '',
        fromEmail: existing.config?.fromEmail || '',
        fromName: existing.config?.fromName || '',
      });
    }
    setShowEmailModal(true);
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return Mail;
      case 'SMS':
        return MessageSquare;
      case 'CALENDAR':
        return Calendar;
      case 'WEBHOOK':
        return Webhook;
      default:
        return Zap;
    }
  };

  const availableIntegrations = [
    {
      type: 'EMAIL',
      name: 'Email',
      description: 'Send emails via Resend',
      icon: Mail,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      type: 'SMS',
      name: 'SMS',
      description: 'Send SMS via Twilio',
      icon: MessageSquare,
      color: 'bg-green-100 text-green-600',
    },
    {
      type: 'CALENDAR',
      name: 'Calendar',
      description: 'Free calendar — built-in or iCal link',
      icon: Calendar,
      color: 'bg-amber-100 text-amber-600',
      linkTo: '/integration/calendar',
    },
    {
      type: 'WEBHOOK',
      name: 'Webhook',
      description: 'Custom webhook integration',
      icon: Webhook,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">Connect external services to your workspace</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Active Integrations */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const Icon = getIntegrationIcon(integration.type);
              const isBuiltInCalendar = integration.id === 'built-in-calendar';

              return (
                <Card key={integration.id}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {integration.type}
                          </h3>
                          <p className="text-sm text-gray-600">{integration.provider}</p>
                        </div>
                      </div>
                      {integration.status === 'CONNECTED' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>

                    <Badge
                      variant={integration.status === 'CONNECTED' ? 'success' : 'danger'}
                    >
                      {integration.status}
                    </Badge>

                    <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                      {isBuiltInCalendar ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => router.push('/integrations/calendar')}
                          className="flex-1"
                        >
                          View Calendar
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleTest(integration.id)}
                            className="flex-1"
                          >
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRemove(integration.id)}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Available Integrations */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {integrations.length > 0 ? 'Add More' : 'Available Integrations'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableIntegrations.map((integration) => {
              const Icon = integration.icon;
              const isInstalled = integrations.some(i => i.type === integration.type);
              const linkTo = (integration as { linkTo?: string }).linkTo;

              // Don't show built-in calendar as "available" if already installed
              if (integration.type === 'CALENDAR' && isInstalled) {
                return null;
              }

              return (
                <Card key={integration.type}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>

                    {linkTo ? (
                      <Link href={linkTo} className="block">
                        <Button
                          variant={isInstalled ? 'secondary' : 'primary'}
                          className="w-full"
                        >
                          {isInstalled ? 'Configure' : 'Setup'}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant={isInstalled ? 'secondary' : 'primary'}
                        className="w-full"
                        onClick={() => {
                          if (integration.type === 'EMAIL') openEmailModal();
                          if (integration.type === 'SMS') setShowSMSModal(true);
                          if (integration.type === 'WEBHOOK') setShowWebhookModal(true);
                        }}
                      >
                        {isInstalled ? 'Configure' : 'Setup'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Email Modal */}
        <Modal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            resetEmailForm();
          }}
          title="Email Integration (Resend)"
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEmailModal(false);
                  resetEmailForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleEmailSetup}>
                Save
              </Button>
            </div>
          }
        >
          <form onSubmit={handleEmailSetup} className="space-y-4">
            <Input
              label="API Key"
              type="password"
              placeholder="re_..."
              value={emailData.apiKey}
              onChange={(e) => setEmailData({ ...emailData, apiKey: e.target.value })}
              required
            />

            <Input
              type="email"
              label="From Email"
              placeholder="noreply@yourdomain.com"
              value={emailData.fromEmail}
              onChange={(e) => setEmailData({ ...emailData, fromEmail: e.target.value })}
            />

            <Input
              label="From Name"
              placeholder="Your Business Name"
              value={emailData.fromName}
              onChange={(e) => setEmailData({ ...emailData, fromName: e.target.value })}
            />

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Get your API key from <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">Resend Dashboard</a>
              </p>
            </div>
          </form>
        </Modal>

        {/* SMS Modal */}
        <Modal
          isOpen={showSMSModal}
          onClose={() => {
            setShowSMSModal(false);
            resetSMSForm();
          }}
          title="SMS Integration (Twilio)"
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSMSModal(false);
                  resetSMSForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSMSSetup}>
                Save
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSMSSetup} className="space-y-4">
            <Input
              label="Account SID"
              type="password"
              placeholder="AC..."
              value={smsData.accountSid}
              onChange={(e) => setSmsData({ ...smsData, accountSid: e.target.value })}
              required
            />

            <Input
              label="Auth Token"
              type="password"
              placeholder="Your auth token"
              value={smsData.authToken}
              onChange={(e) => setSmsData({ ...smsData, authToken: e.target.value })}
              required
            />

            <Input
              type="tel"
              label="Phone Number"
              placeholder="+1234567890"
              value={smsData.phoneNumber}
              onChange={(e) => setSmsData({ ...smsData, phoneNumber: e.target.value })}
              required
            />

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Get your credentials from <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="underline">Twilio Console</a>
              </p>
            </div>
          </form>
        </Modal>

        {/* Webhook Modal */}
        <Modal
          isOpen={showWebhookModal}
          onClose={() => {
            setShowWebhookModal(false);
            resetWebhookForm();
          }}
          title="Webhook Integration"
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowWebhookModal(false);
                  resetWebhookForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleWebhookSetup}>
                Save
              </Button>
            </div>
          }
        >
          <form onSubmit={handleWebhookSetup} className="space-y-4">
            <Input
              label="Webhook URL"
              type="url"
              placeholder="https://your-app.com/webhook"
              value={webhookData.url}
              onChange={(e) => setWebhookData({ ...webhookData, url: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Events to Subscribe
              </label>
              <div className="space-y-2">
                {['booking.created', 'booking.updated', 'contact.created', 'form.submitted'].map((event) => (
                  <label key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      checked={webhookData.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWebhookData({ ...webhookData, events: [...webhookData.events, event] });
                        } else {
                          setWebhookData({ ...webhookData, events: webhookData.events.filter(e => e !== event) });
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Secret (Optional)"
              type="password"
              placeholder="Webhook signing secret"
              value={webhookData.secret}
              onChange={(e) => setWebhookData({ ...webhookData, secret: e.target.value })}
            />
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
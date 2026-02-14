'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { formAPI } from '@/lib/api';
import { formatDate, handleApiError } from '@/lib/utils';
import { FileCheck, Filter, Eye } from 'lucide-react';

export default function FormSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [filterStatus]);

  const loadSubmissions = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await formAPI.getAllSubmissions(params);
      setSubmissions(response.data.data);
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (submission: any) => {
    setSelectedSubmission(submission);
    setShowDetailsModal(true);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
            <p className="text-gray-600 mt-1">View all form submissions across your workspace</p>
          </div>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Filters */}
        <Card>
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </Card>

        {/* Submissions List */}
        <Card>
          <div className="space-y-4">
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{submission.form.name}</h4>
                        <Badge
                          variant={
                            submission.status === 'COMPLETED'
                              ? 'success'
                              : submission.status === 'PENDING'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        {submission.contact && (
                          <p>
                            <span className="font-medium">Contact:</span>{' '}
                            {submission.contact.firstName} {submission.contact.lastName} ({submission.contact.email})
                          </p>
                        )}
                        {submission.booking && (
                          <p>
                            <span className="font-medium">Booking:</span> {submission.booking.bookingType.name}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Submitted:</span>{' '}
                          {formatDate(submission.completedAt || submission.createdAt, 'MMM dd, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>

                    <Button size="sm" variant="secondary" onClick={() => viewDetails(submission)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No submissions found</p>
                <p className="text-sm mt-1">Submissions will appear here once forms are filled out</p>
              </div>
            )}
          </div>
        </Card>

        {/* Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Submission Details"
          size="lg"
        >
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Form Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                  <p><span className="font-medium">Form:</span> {selectedSubmission.form.name}</p>
                  <p><span className="font-medium">Type:</span> {selectedSubmission.form.type}</p>
                  <p><span className="font-medium">Status:</span> {selectedSubmission.status}</p>
                </div>
              </div>

              {selectedSubmission.contact && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedSubmission.contact.firstName} {selectedSubmission.contact.lastName}</p>
                    <p><span className="font-medium">Email:</span> {selectedSubmission.contact.email}</p>
                    {selectedSubmission.contact.phone && (
                      <p><span className="font-medium">Phone:</span> {selectedSubmission.contact.phone}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Submitted Data</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedSubmission.data, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
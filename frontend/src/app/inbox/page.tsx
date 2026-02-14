'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { conversationAPI } from '@/lib/api';
import { formatRelativeTime, handleApiError } from '@/lib/utils';
import { MessageSquare, Send, Mail, Phone, X, Check } from 'lucide-react';

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await conversationAPI.getAll();
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    
    // Reload conversation to get latest messages
    try {
      const response = await conversationAPI.getById(conversation.id);
      setSelectedConversation(response.data.data);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const response = await conversationAPI.sendMessage(selectedConversation.id, {
        body: newMessage,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        sender: 'workspace@example.com', // Should be from workspace settings
        recipient: selectedConversation.contact.email,
      });

      // Update selected conversation with new messages
      setSelectedConversation(response.data.data);
      
      // Update conversations list
      const updatedConversations = conversations.map(conv => 
        conv.id === selectedConversation.id ? response.data.data : conv
      );
      setConversations(updatedConversations);

      setNewMessage('');
      setAlert({ type: 'success', message: 'Message sent successfully!' });
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedConversation) return;

    try {
      const response = await conversationAPI.updateStatus(selectedConversation.id, status);
      setSelectedConversation(response.data.data);
      
      // Update in conversations list
      const updatedConversations = conversations.map(conv => 
        conv.id === selectedConversation.id ? response.data.data : conv
      );
      setConversations(updatedConversations);

      setAlert({ type: 'success', message: `Conversation marked as ${status}!` });
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-600 mt-1">Manage customer conversations</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <div className="space-y-2">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-primary-50 border-2 border-primary-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {conversation.contact?.firstName} {conversation.contact?.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {conversation.contact?.email}
                        </p>
                      </div>
                      <Badge
                        variant={
                          conversation.status === 'OPEN'
                            ? 'success'
                            : conversation.status === 'PENDING'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {conversation.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-700 mb-2 truncate">
                      {conversation.subject || 'No subject'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{conversation.messages?.length || 0} messages</span>
                      <span>{formatRelativeTime(conversation.lastMessageAt || conversation.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No conversations yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <div className="flex flex-col h-[600px]">
                {/* Header */}
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.contact?.firstName}{' '}
                        {selectedConversation.contact?.lastName}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {selectedConversation.contact?.email}
                        </div>
                        {selectedConversation.contact?.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {selectedConversation.contact?.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant={selectedConversation.status === 'OPEN' ? 'primary' : 'secondary'}
                        onClick={() => handleUpdateStatus('OPEN')}
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedConversation.status === 'PENDING' ? 'primary' : 'secondary'}
                        onClick={() => handleUpdateStatus('PENDING')}
                      >
                        Pending
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedConversation.status === 'CLOSED' ? 'primary' : 'secondary'}
                        onClick={() => handleUpdateStatus('CLOSED')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Close
                      </Button>
                    </div>
                  </div>

                  {selectedConversation.subject && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Subject:</span> {selectedConversation.subject}
                    </p>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                    selectedConversation.messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-3 ${
                            message.direction === 'OUTBOUND'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.subject && (
                            <p className="text-xs font-medium mb-1 opacity-80">
                              {message.subject}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                          <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                            <span>
                              {formatRelativeTime(message.createdAt)}
                            </span>
                            {message.channel && (
                              <span className="uppercase text-[10px]">
                                {message.channel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>No messages in this conversation yet</p>
                    </div>
                  )}
                </div>

                {/* Send Message Form */}
                <form onSubmit={handleSendMessage} className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <textarea
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={2}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      loading={sendingMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </form>
              </div>
            ) : (
              <div className="text-center py-24 text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
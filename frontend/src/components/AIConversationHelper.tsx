'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { aiAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface AIConversationHelperProps {
  conversationId: string;
  onUseSuggestion?: (text: string) => void;
}

export default function AIConversationHelper({ conversationId, onUseSuggestion }: AIConversationHelperProps) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const toast = useToast();

  const handleGetSuggestion = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.suggestReply(conversationId);
      setSuggestion(response.data.data.suggestedReply);
    } catch (error) {
      toast.error('Failed to get AI suggestion');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleUse = () => {
    if (onUseSuggestion) {
      onUseSuggestion(suggestion);
      setSuggestion('');
    }
  };

  return (
    <>
      <toast.ToastContainer />
      
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-indigo-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">AI Reply Assistant</h3>
          </div>
          {!suggestion && (
            <button
              onClick={handleGetSuggestion}
              disabled={loading}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get AI Suggestion
                </>
              )}
            </button>
          )}
        </div>

        {suggestion && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{suggestion}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUse}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Use This Reply
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSuggestion('');
                  handleGetSuggestion();
                }}
                disabled={loading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}

        {!suggestion && !loading && (
          <p className="text-sm text-gray-600">
            Click to get an AI-powered reply suggestion based on the conversation context.
          </p>
        )}
      </div>
    </>
  );
}
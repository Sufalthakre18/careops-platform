'use client';

import { useState } from 'react';
import { Wand2, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { aiAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface FormField {
  id: string;
  question: string;
  type: string;
  required: boolean;
}

interface AIFormBuilderProps {
  onSave?: (fields: FormField[]) => void;
}

export default function AIFormBuilder({ onSave }: AIFormBuilderProps) {
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();

  const handleGenerateWithAI = async () => {
    if (!description.trim()) {
      toast.error('Please enter a form description');
      return;
    }

    setLoading(true);
    try {
      const response = await aiAPI.generateFormQuestions(description, 5);
      const generatedFields = response.data.data.map((field: any, index: number) => ({
        id: `field-${Date.now()}-${index}`,
        question: field.question,
        type: field.type,
        required: field.required,
      }));
      setFields(generatedFields);
      toast.success('Form questions generated with AI!');
    } catch (error) {
      toast.error('Failed to generate form questions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    setFields([
      ...fields,
      {
        id: `field-${Date.now()}`,
        question: '',
        type: 'text',
        required: false,
      },
    ]);
  };

  const updateField = (id: string, key: string, value: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = () => {
    if (fields.length === 0) {
      toast.error('Add at least one field');
      return;
    }
    if (onSave) {
      onSave(fields);
      toast.success('Form saved!');
    }
  };

  return (
    <>
      <toast.ToastContainer />
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Form Builder</h2>

        {/* AI Generator */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-start gap-3">
            <Wand2 className="w-5 h-5 text-indigo-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">AI Form Generator</h3>
              <p className="text-sm text-gray-600 mb-3">
                Describe your form and let AI generate the questions for you
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Patient medical history form with questions about allergies, medications, and past surgeries"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                rows={3}
              />
              <button
                onClick={handleGenerateWithAI}
                disabled={loading || !description.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question {index + 1}
                    </label>
                    <input
                      type="text"
                      value={field.question}
                      onChange={(e) => updateField(field.id, 'question', e.target.value)}
                      placeholder="Enter your question"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="date">Date</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Required</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeField(field.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={addField}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
          {fields.length > 0 && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Form
            </button>
          )}
        </div>
      </div>
    </>
  );
}
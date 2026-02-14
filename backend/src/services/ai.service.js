import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * AI Chat Completion using Groq
 * Models: llama-3.3-70b-versatile (best), mixtral-8x7b-32768, gemma2-9b-it
 */
export const chatCompletion = async (messages, options = {}) => {
  try {
    const completion = await groq.chat.completions.create({
      model: options.model || 'llama-3.3-70b-versatile',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
      top_p: options.topP || 1,
      stream: false,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq AI Error:', error);
    throw error;
  }
};

/**
 * Generate AI response for customer inquiry
 */
export const generateCustomerResponse = async (inquiry, businessContext) => {
  const prompt = `You are a helpful customer service assistant for ${businessContext.businessName}.

Business Information:
- Name: ${businessContext.businessName}
- Services: ${businessContext.services || 'General services'}
- Location: ${businessContext.location || 'Not specified'}

Customer Inquiry:
"${inquiry}"

Generate a friendly, professional response that:
1. Addresses the customer's question
2. Provides helpful information
3. Encourages booking if relevant
4. Is concise (2-3 sentences)

Response:`;

  const messages = [
    {
      role: 'system',
      content: 'You are a professional customer service assistant. Be helpful, concise, and friendly.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  return await chatCompletion(messages);
};

/**
 * Suggest reply for staff based on conversation
 */
export const suggestReply = async (conversationHistory, context) => {
  const messages = [
    {
      role: 'system',
      content: `You are helping staff respond to customers for ${context.businessName}. Generate brief, professional replies.`,
    },
    {
      role: 'user',
      content: `Based on this conversation, suggest a professional reply:\n\n${conversationHistory}\n\nSuggested reply:`,
    },
  ];

  return await chatCompletion(messages, { temperature: 0.5, maxTokens: 200 });
};

/**
 * Analyze customer sentiment
 */
export const analyzeSentiment = async (text) => {
  const messages = [
    {
      role: 'system',
      content: 'Analyze the sentiment of customer messages. Respond with ONLY one word: POSITIVE, NEGATIVE, or NEUTRAL.',
    },
    {
      role: 'user',
      content: text,
    },
  ];

  const result = await chatCompletion(messages, { temperature: 0.3, maxTokens: 10 });
  return result.trim().toUpperCase();
};

/**
 * Extract booking intent from message
 */
export const extractBookingIntent = async (message) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a booking intent detector. Respond with JSON only: {"hasBookingIntent": true/false, "suggestedService": "service name or null", "suggestedDate": "date or null"}',
    },
    {
      role: 'user',
      content: `Analyze this message for booking intent: "${message}"`,
    },
  ];

  try {
    const result = await chatCompletion(messages, { temperature: 0.2, maxTokens: 100 });
    return JSON.parse(result);
  } catch {
    return { hasBookingIntent: false, suggestedService: null, suggestedDate: null };
  }
};

/**
 * Generate form questions from description
 */
export const generateFormQuestions = async (formDescription, numberOfQuestions = 5) => {
  const messages = [
    {
      role: 'system',
      content: 'Generate relevant form questions in JSON format: [{"question": "...", "type": "text|email|phone|textarea|select", "required": true/false}]',
    },
    {
      role: 'user',
      content: `Generate ${numberOfQuestions} form questions for: ${formDescription}`,
    },
  ];

  try {
    const result = await chatCompletion(messages, { temperature: 0.5 });
    return JSON.parse(result);
  } catch {
    return [];
  }
};

/**
 * Summarize long conversation
 */
export const summarizeConversation = async (messages) => {
  const conversation = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  
  const prompt = [
    {
      role: 'system',
      content: 'Summarize conversations in 2-3 sentences, highlighting key points and action items.',
    },
    {
      role: 'user',
      content: `Summarize this conversation:\n\n${conversation}`,
    },
  ];

  return await chatCompletion(prompt, { maxTokens: 150 });
};

/**
 * Smart booking recommendations
 */
export const recommendBookingTime = async (customerPreferences, availableSlots) => {
  const messages = [
    {
      role: 'system',
      content: 'Recommend the best booking time based on customer preferences. Respond with JSON: {"recommendedSlot": "time", "reason": "brief reason"}',
    },
    {
      role: 'user',
      content: `Customer preferences: ${customerPreferences}\nAvailable slots: ${availableSlots.join(', ')}\n\nRecommend best slot:`,
    },
  ];

  try {
    const result = await chatCompletion(messages, { temperature: 0.3 });
    return JSON.parse(result);
  } catch {
    return { recommendedSlot: availableSlots[0], reason: 'First available slot' };
  }
};

export default {
  chatCompletion,
  generateCustomerResponse,
  suggestReply,
  analyzeSentiment,
  extractBookingIntent,
  generateFormQuestions,
  summarizeConversation,
  recommendBookingTime,
};
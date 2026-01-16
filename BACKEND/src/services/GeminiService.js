import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // Log to verify API key is loaded
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Gemini API Key status:', apiKey ? `Loaded (${apiKey.substring(0, 10)}...)` : 'Missing');

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use latest gemini-2.0-flash-exp model with premium API key
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    this.systemPrompt = `You are a helpful veterinary assistant chatbot. Your role is to provide simple, easy-to-understand information about pet care.

IMPORTANT RESPONSE RULES:

1. KEEP ANSWERS SHORT AND SIMPLE:
   - Use simple English, no complex medical terms
   - Give brief answers (2-3 sentences max unless asked for details)
   - Avoid using asterisks or markdown formatting
   - No bullet points or lists unless specifically requested
   - Speak like a friendly neighbor, not a textbook

2. FOR GREETINGS:
   - Reply with: "Hello! How can I help with your pet today?"
   - Keep it short and friendly

3. FOR PET QUESTIONS:
   - Give direct, simple answers
   - Example: "If your dog is vomiting, don't give food for 12 hours. Give small amounts of water. If it continues, see a vet."
   - NOT: "**Vomiting in dogs** can be caused by * dietary indiscretion * infections * toxins..."

4. FOR NON-PET QUESTIONS:
   - Reply: "I only help with pet questions. What would you like to know about your pet?"

5. APPOINTMENT BOOKING:
   - If someone says "appointment" or "book" - let the system handle it
   - Don't give booking instructions

6. NEVER:
   - Use asterisks for emphasis
   - Use bullet points unless asked
   - Give long explanations unless asked
   - Use medical jargon
   - Diagnose diseases
   - Prescribe medicine

Remember: Keep it SIMPLE and SHORT. Talk like you're chatting with a friend about their pet.`;
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      // Build the conversation context
      const messages = [
        this.systemPrompt,
        ...conversationHistory.map(msg =>
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ),
        `User: ${userMessage}`,
        'Assistant:'
      ].join('\n\n');

      // Generate response
      const result = await this.model.generateContent(messages);
      const response = result.response;
      const text = response.text();

      return {
        success: true,
        message: text
      };
    } catch (error) {
      console.error('Gemini API error:', error);

      // Fallback response for API errors
      return {
        success: false,
        message: 'I apologize, but I\'m having trouble processing your request right now. Please try again later or contact your veterinarian directly for urgent matters.'
      };
    }
  }

  // Check if the message is about veterinary topics
  isVeterinaryRelated(message) {
    const veterinaryKeywords = [
      'pet', 'dog', 'cat', 'animal', 'vet', 'veterinary', 'vaccine',
      'health', 'sick', 'symptom', 'medicine', 'treatment', 'diet',
      'food', 'behavior', 'training', 'puppy', 'kitten', 'bird',
      'rabbit', 'hamster', 'fish', 'reptile', 'horse', 'cow'
    ];

    const lowerMessage = message.toLowerCase();
    return veterinaryKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

export default new GeminiService();
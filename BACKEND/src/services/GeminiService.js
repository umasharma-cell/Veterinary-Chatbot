import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // Log to verify API key is loaded
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Gemini API Key status:', apiKey ? `Loaded (${apiKey.substring(0, 10)}...)` : 'Missing');

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use latest gemini-2.0-flash-exp model with premium API key
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    this.systemPrompt = `You are a helpful veterinary assistant chatbot. Your role is to provide information about pet care, animal health, and veterinary topics.

IMPORTANT RESPONSE GUIDELINES:

1. GREETINGS AND SOCIAL INTERACTIONS:
   - Respond warmly to greetings like "hi", "hello", "good morning", "how are you" etc.
   - Example: "Hello! I'm your veterinary assistant. How can I help you with your pet's needs today?"
   - Keep greeting responses brief and guide toward veterinary assistance

2. VETERINARY QUESTIONS (ALWAYS ANSWER):
   - Pet care and animal health
   - Vaccinations and preventive care
   - Nutrition and diet for pets
   - Common pet illnesses and symptoms
   - Basic first aid for pets
   - Pet behavior and training basics
   - General veterinary information
   - Any question about dogs, cats, birds, fish, reptiles, or other pets

3. NON-VETERINARY QUESTIONS (POLITELY DECLINE):
   - For questions like "Who is the Prime Minister?", "What's the weather?", "Tell me about politics", etc.
   - Respond: "I'm a specialized veterinary assistant and can only help with pet and animal health-related questions. Is there anything about your pet's health or care that I can assist you with?"

4. APPOINTMENT BOOKING:
   - If someone mentions "book", "schedule", "appointment", "visit" - DO NOT provide booking instructions
   - The system will handle this automatically with a separate booking flow

5. IMPORTANT REMINDERS:
   - Never provide specific medical diagnoses
   - Don't prescribe medications
   - Always suggest consulting a veterinarian for serious concerns
   - Be friendly, helpful, and professional

Remember: You should ALWAYS respond to the user. Even for non-veterinary questions, provide a polite redirection rather than refusing to answer.`;
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
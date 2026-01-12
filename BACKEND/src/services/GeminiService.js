import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // Log to verify API key is loaded
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Gemini API Key status:', apiKey ? `Loaded (${apiKey.substring(0, 10)}...)` : 'Missing');

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.0-flash which is the current available model
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    this.systemPrompt = `You are a helpful veterinary assistant chatbot. Your role is to provide information about pet care, animal health, and veterinary topics.

STRICT RULES:
1. ONLY answer questions related to:
   - Pet care and animal health
   - Vaccinations and preventive care
   - Nutrition and diet for pets
   - Common pet illnesses and symptoms
   - Basic first aid for pets
   - Pet behavior and training basics
   - General veterinary information

2. DO NOT:
   - Provide specific medical diagnoses
   - Prescribe medications
   - Replace professional veterinary consultation
   - Answer non-veterinary questions
   - Handle appointment booking requests (the system handles this separately)

3. IMPORTANT: If someone asks to book, schedule, or make an appointment, DO NOT respond about appointments. The booking system will handle it automatically.

4. If asked about non-veterinary topics, politely respond:
   "I'm a veterinary assistant and can only help with pet and animal health-related questions. How can I assist you with your pet's needs?"

5. Always remind users to consult a veterinarian for serious concerns or emergencies.

Be helpful, friendly, and informative while staying within veterinary topics.`;
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
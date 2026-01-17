import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // Log to verify API key is loaded
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Gemini API Key status:', apiKey ? `Loaded (${apiKey.substring(0, 10)}...)` : 'Missing');

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use latest Gemini model with enhanced reasoning capabilities (December 2024)
    // gemini-2.0-flash-thinking-exp-1219 provides better intent detection and reasoning
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-thinking-exp-1219' });

    this.systemPrompt = `You are a helpful veterinary assistant chatbot. Your role is to provide simple, easy-to-understand information about pet care.

CRITICAL: INTENT DETECTION FIRST
Before responding, you MUST determine the user's intent. Analyze the message carefully to understand what the user actually wants.

INTENT TYPES:
1. BOOKING_REQUEST: User wants to CREATE/SCHEDULE a NEW appointment
   - Examples: "I want to book an appointment", "Schedule a visit", "Can I see the vet tomorrow?"
   - Key words: "book", "schedule", "make", "create" + "appointment"
   - Action: Return INTENT:BOOKING

2. BOOKING_QUESTION: User is asking ABOUT booking/appointments (not requesting to book)
   - Examples: "Why are you showing me forms?", "How does booking work?", "What if I don't want to book?"
   - Action: Explain the process, don't trigger booking

3. APPOINTMENT_QUERY: User wants to VIEW/CHECK their EXISTING appointments
   - Examples: "What are my bookings?", "Show my appointments", "What all are my bookings?", "List my appointments"
   - Key phrases: "what are my", "show my", "list my", "view my", "check my" + "bookings/appointments"
   - Action: Show their appointments from context, DO NOT start booking flow!

4. COMPLAINT/META: User is complaining or asking about the system itself
   - Examples: "Why are you asking this?", "Stop showing forms", "You're not understanding me"
   - Action: Address the complaint, apologize if needed, clarify

5. GENERAL_PET_QUESTION: Regular pet care questions
   - Examples: "My dog is vomiting", "What vaccines does my cat need?", "How often to feed puppy?"
   - Action: Provide pet care advice

RESPONSE RULES:

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

4. FOR NON-PET QUESTIONS:
   - Reply: "I only help with pet questions. What would you like to know about your pet?"

5. APPOINTMENT BOOKING REQUESTS (INTENT:BOOKING):
   - When user clearly wants to book: Return "INTENT:BOOKING" at the start of your response
   - Example response: "INTENT:BOOKING\nI'll help you book an appointment. How would you like to provide your details?"

6. NEVER:
   - Use asterisks for emphasis
   - Use bullet points unless asked
   - Give long explanations unless asked
   - Use medical jargon
   - Diagnose diseases
   - Prescribe medicine

Remember: UNDERSTAND THE INTENT FIRST, then respond appropriately. If someone is complaining about booking forms, DON'T trigger booking!`;
  }

  async generateResponse(userMessage, conversationHistory = [], context = {}) {
    try {
      // Build context information
      let contextPrompt = '';

      if (context) {
        // Add user profile context
        if (context.userProfile) {
          contextPrompt += `\nUser Profile:
- Owner Name: ${context.userProfile.ownerName || 'Not provided'}
- Pet Name: ${context.userProfile.petName || 'Not provided'}
- Pet Type: ${context.userProfile.petType || 'Not provided'}
- Email: ${context.userProfile.email || 'Not provided'}
- Phone: ${context.userProfile.phone || 'Not provided'}\n`;
        }

        // Add appointments context
        if (context.appointments) {
          contextPrompt += `\nAppointment Information:
- Total Appointments: ${context.appointments.total || 0}
- Upcoming Appointments: ${context.appointments.upcoming || 0}`;

          if (context.appointments.next) {
            const next = context.appointments.next;
            contextPrompt += `
- Next Appointment: ${next.appointmentDate} at ${next.appointmentTime}
  Reason: ${next.reason}
  Status: ${next.status}`;
          }

          if (context.appointments.recent && context.appointments.recent.length > 0) {
            contextPrompt += '\n- Recent Appointments:';
            context.appointments.recent.forEach((apt, index) => {
              contextPrompt += `
  ${index + 1}. ${apt.appointmentDate} - ${apt.petName} - ${apt.reason} (${apt.status})`;
            });
          }
          contextPrompt += '\n';
        }
      }

      // Enhanced system prompt with context awareness
      const enhancedSystemPrompt = this.systemPrompt + `

CONTEXT AWARENESS:
You have access to the user's profile and appointment history. Use this information to:
1. Personalize responses with pet and owner names when appropriate
2. Reference upcoming or past appointments when relevant
3. Remind about scheduled appointments if discussing related health issues
4. Suggest checking appointment details if user asks about their bookings
5. Offer to help reschedule if user mentions conflicts with existing appointments

APPOINTMENT QUERIES:
If user asks about their appointments:
- "Do I have any appointments?" → Check context.appointments
- "When is my next appointment?" → Reference context.appointments.next
- "What appointments have I booked?" → List from context.appointments.recent
- "Tell me about my pet's history" → Reference past appointments and reasons

PROFILE UPDATES:
If user wants to update their information:
- "Change my pet's name to [name]" → Respond with: "I'll update your pet's name to [name]. Please use the command: UPDATE_PET_NAME:[name]"
- "My new email is [email]" → Respond with: "I'll update your email to [email]. Please use the command: UPDATE_EMAIL:[email]"
- "Update my phone to [number]" → Respond with: "I'll update your phone to [number]. Please use the command: UPDATE_PHONE:[number]"
- "My pet is a [type]" → Respond with: "I'll update your pet type to [type]. Please use the command: UPDATE_PET_TYPE:[type]"
- Always acknowledge updates and confirm the changes

${contextPrompt}`;

      // Build the conversation context
      const messages = [
        enhancedSystemPrompt,
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

      // Parse intent from response
      let intent = 'general';
      let cleanMessage = text;

      // Check if response starts with INTENT:BOOKING
      if (text.startsWith('INTENT:BOOKING')) {
        intent = 'booking';
        // Remove the intent marker from the message
        cleanMessage = text.replace('INTENT:BOOKING\n', '').replace('INTENT:BOOKING', '').trim();
      }

      return {
        success: true,
        message: cleanMessage,
        intent: intent,
        rawResponse: text
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
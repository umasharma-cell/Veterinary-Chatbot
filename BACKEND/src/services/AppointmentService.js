class AppointmentService {
  // Check if user wants to book an appointment
  detectBookingIntent(message) {
    const bookingPhrases = [
      'book an appointment',
      'book appointment',
      'schedule appointment',
      'make appointment',
      'book a visit',
      'schedule a visit',
      'see a vet',
      'visit vet',
      'need appointment',
      'want appointment',
      'appointment please',
      'book consultation',
      'schedule consultation',
      'need to see vet',
      'want to see vet',
      'i want to book',
      'i need to book',
      'can i book',
      'like to book',
      'make a booking',
      'schedule vet'
    ];

    const lowerMessage = message.toLowerCase();
    const isBooking = bookingPhrases.some(phrase => lowerMessage.includes(phrase));
    console.log('Checking booking intent for:', message);
    console.log('Lowercase message:', lowerMessage);
    console.log('Is booking intent?', isBooking);
    return isBooking;
  }

  // Get the next question based on current state
  getNextQuestion(state, appointmentData = {}) {
    switch (state) {
      case 'ASK_OWNER_NAME':
        return {
          message: 'Great! I\'ll help you book an appointment. May I have your full name, please?',
          nextState: 'ASK_PET_NAME'
        };

      case 'ASK_PET_NAME':
        return {
          message: 'Thank you! What\'s your pet\'s name?',
          nextState: 'ASK_PHONE'
        };

      case 'ASK_PHONE':
        return {
          message: 'What\'s the best phone number to reach you at?',
          nextState: 'ASK_DATE_TIME'
        };

      case 'ASK_DATE_TIME':
        return {
          message: 'When would you prefer to schedule the appointment? Please provide your preferred date and time.',
          nextState: 'CONFIRMATION'
        };

      case 'CONFIRMATION':
        return {
          message: this.getConfirmationMessage(appointmentData),
          nextState: 'COMPLETED'
        };

      case 'COMPLETED':
        return {
          message: 'Your appointment has been successfully booked! We\'ll contact you shortly to confirm. Is there anything else I can help you with?',
          nextState: 'NONE'
        };

      default:
        return null;
    }
  }

  // Generate confirmation message
  getConfirmationMessage(data) {
    return `Perfect! Let me confirm your appointment details:

Owner Name: ${data.ownerName}
Pet Name: ${data.petName}
Phone: ${data.phone}
Preferred Date/Time: ${data.preferredDateTime}

Is this information correct? (Type 'yes' to confirm or 'no' to start over)`;
  }

  // Validate phone number (basic validation)
  validatePhone(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's a valid length (10-15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return {
        valid: false,
        message: 'Please provide a valid phone number with at least 10 digits.'
      };
    }

    return {
      valid: true,
      cleaned: cleaned
    };
  }

  // Process user response during booking flow
  processBookingResponse(state, userMessage, appointmentData) {
    console.log('Processing booking response for state:', state);
    console.log('Current appointment data:', appointmentData);
    console.log('User message:', userMessage);

    const response = {
      data: { ...appointmentData },
      isValid: true,
      errorMessage: null
    };

    // We process based on what we're ASKING for, not what we just got
    // The state tells us what question we asked the user
    switch (state) {
      case 'ASK_PET_NAME':
        // We asked for owner name, so this response is the owner name
        if (userMessage.trim().length < 2) {
          response.isValid = false;
          response.errorMessage = 'Please provide a valid name.';
        } else {
          response.data.ownerName = userMessage.trim();
        }
        break;

      case 'ASK_PHONE':
        // We asked for pet name, so this response is the pet name
        if (userMessage.trim().length < 1) {
          response.isValid = false;
          response.errorMessage = 'Please provide your pet\'s name.';
        } else {
          response.data.petName = userMessage.trim();
        }
        break;

      case 'ASK_DATE_TIME':
        // We asked for phone, so this response is the phone
        const phoneValidation = this.validatePhone(userMessage);
        if (!phoneValidation.valid) {
          response.isValid = false;
          response.errorMessage = phoneValidation.message;
        } else {
          response.data.phone = phoneValidation.cleaned;
        }
        break;

      case 'CONFIRMATION':
        // We asked for date/time, so this response is the date/time
        if (userMessage.trim().length < 3) {
          response.isValid = false;
          response.errorMessage = 'Please provide a preferred date and time.';
        } else {
          response.data.preferredDateTime = userMessage.trim();
        }
        break;

      case 'COMPLETED':
        // We're asking for confirmation (yes/no)
        const lowerMessage = userMessage.toLowerCase().trim();
        if (lowerMessage === 'yes' || lowerMessage === 'confirm' || lowerMessage === 'y') {
          response.confirmed = true;
        } else if (lowerMessage === 'no' || lowerMessage === 'cancel' || lowerMessage === 'n') {
          response.cancelled = true;
          response.data = {}; // Reset data
        } else {
          response.isValid = false;
          response.errorMessage = 'Please type "yes" to confirm or "no" to start over.';
        }
        break;
    }

    console.log('Response after processing:', response);
    return response;
  }

  // Check if user wants to cancel booking
  detectCancelIntent(message) {
    const cancelPhrases = ['cancel', 'stop', 'nevermind', 'forget it', 'exit'];
    const lowerMessage = message.toLowerCase();
    return cancelPhrases.some(phrase => lowerMessage.includes(phrase));
  }
}

export default new AppointmentService();
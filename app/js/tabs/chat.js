/**
 * Chat Tab Manager
 * Handles medical chat functionality
 */

class ChatManager {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.chatHistory = [];
        this.sessionId = this.generateSessionId();
    }

    /**
     * Generate a unique session ID for this chat session
     */
    generateSessionId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Initialize the Chat tab
     */
    async init() {
        try {
            this.setupEventListeners();
            // History fetch must not block chat UI
            await Promise.race([
                this.loadChatHistory(),
                new Promise((resolve) => setTimeout(resolve, 8000)),
            ]);
            if (!this.chatHistory.length) {
                this.chatHistory = [{
                    id: 1,
                    message: "Hello! I'm your medical assistant. How can I help you today?",
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                }];
                this.displayChatHistory();
            }
            console.log('Chat tab initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Chat tab:', error);
            this.showError('Failed to initialize chat. Please try again.');
        }
    }

    /**
     * Load chat history
     */
    async loadChatHistory() {
        try {
            if (window.djangoAPI) {
                console.log('📚 Loading chat history for session:', this.sessionId);
                const response = await window.djangoAPI.makeRequest(`/chat/history/?session_id=${this.sessionId}&limit=20`);
                this.chatHistory = response.messages || [];
                console.log('✅ Loaded chat history:', this.chatHistory.length, 'messages');
            } else {
                // Mock chat history
                this.chatHistory = [
                    {
                        id: 1,
                        message: "Hello! I'm your medical assistant. How can I help you today?",
                        sender: 'bot',
                        timestamp: new Date().toISOString()
                    }
                ];
            }
            
            this.displayChatHistory();
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    /**
     * Display chat history
     */
    displayChatHistory() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messagesHtml = this.chatHistory.map(msg => this.createMessageHtml(msg)).join('');
        messagesContainer.innerHTML = messagesHtml;
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    /**
     * Escape HTML then light-format assistant markdown (bold, lists, newlines).
     */
    formatMessageText(text) {
        const raw = String(text || '');
        const escaped = raw
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return escaped
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/^[\-\*]\s+(.+)$/gm, '• $1')
            .replace(/\n/g, '<br>');
    }

    /**
     * Create message HTML
     */
    createMessageHtml(message) {
        const isBot = message.sender === 'bot';
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        const provider = message.provider
            ? `<div class="message-time">via ${message.provider}</div>`
            : '';
        
        return `
            <div class="chat-message ${isBot ? 'bot' : 'user'}">
                <div class="message-bubble ${isBot ? 'bot' : 'user'}">
                    ${isBot ? '<i class="fas fa-robot me-2"></i>' : ''}
                    ${this.formatMessageText(message.message)}
                    <div class="message-time">${timestamp}</div>
                    ${isBot ? provider : ''}
                </div>
            </div>
        `;
    }

    /**
     * Send message
     */
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Clear input
        input.value = '';

        // Add user message to chat
        const userMessage = {
            id: Date.now(),
            message: message,
            sender: 'user',
            timestamp: new Date().toISOString()
        };
        
        this.addMessageToChat(userMessage);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            let botResponse;
            let provider = null;
            if (window.djangoAPI && typeof window.djangoAPI.sendChatMessage === 'function') {
                console.log('🤖 Sending message to Django Qwen/Ollama backend:', message);
                let patientId = null;
                try {
                    patientId = window.app?.getCurrentUser?.()?.id || null;
                } catch (_) { /* ignore */ }

                const response = await window.djangoAPI.sendChatMessage({
                    message,
                    sessionId: this.sessionId,
                    patientId,
                });
                botResponse = response.response || response.message || 'I received your message.';
                provider = response.llm_provider || 'ollama';
                console.log('✅ Received AI response via', provider, botResponse.slice(0, 120));
            } else if (window.djangoAPI) {
                const response = await window.djangoAPI.makeRequest('/chat/', {
                    method: 'POST',
                    timeout: 120000,
                    body: JSON.stringify({
                        message,
                        session_id: this.sessionId,
                    }),
                });
                botResponse = response.response || response.message || 'I received your message.';
                provider = response.llm_provider || null;
            } else {
                console.log('⚠️ Django API not available, using mock response');
                botResponse = this.generateMockResponse(message);
                provider = 'offline';
            }

            // Hide typing indicator
            this.hideTypingIndicator();

            // Add bot response to chat
            const botMessage = {
                id: Date.now() + 1,
                message: botResponse,
                sender: 'bot',
                timestamp: new Date().toISOString(),
                provider,
            };
            
            this.addMessageToChat(botMessage);

        } catch (error) {
            console.error('Failed to send message:', error);
            this.hideTypingIndicator();
            
            const detail = (error && error.message) ? error.message : 'unknown error';
            const errorMessage = {
                id: Date.now() + 1,
                message: `I'm having trouble reaching the medical AI right now (${detail}). Please try again in a moment.`,
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            
            this.addMessageToChat(errorMessage);
        }
    }

    /**
     * Generate mock response
     */
    generateMockResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        if (message.includes('emergency') || message.includes('urgent')) {
            return "If this is a medical emergency, please call 911 immediately or go to the nearest emergency room. I can help you find nearby hospitals if needed.";
        } else if (message.includes('pain') || message.includes('hurt')) {
            return "I understand you're experiencing pain. Can you describe the location and severity of the pain? On a scale of 1-10, how would you rate it?";
        } else if (message.includes('fever') || message.includes('temperature')) {
            return "Fever can be a sign of infection. If your temperature is above 101.3°F (38.5°C) or if you have other concerning symptoms, please seek medical attention.";
        } else if (message.includes('medication') || message.includes('medicine')) {
            return "I can provide general information about medications, but I cannot give specific medical advice. Please consult with your healthcare provider for medication-related questions.";
        } else if (message.includes('hospital') || message.includes('er')) {
            return "I can help you find nearby hospitals and emergency rooms. Would you like me to show you the closest medical facilities?";
        } else if (message.includes('hello') || message.includes('hi')) {
            return "Hello! I'm your medical assistant. I can help you with general health information, find nearby medical facilities, and provide guidance on when to seek medical care.";
        } else {
            return "I'm here to help with general health information and finding medical resources. For specific medical advice, please consult with a healthcare professional. How else can I assist you?";
        }
    }

    /**
     * Add message to chat
     */
    addMessageToChat(message) {
        this.chatHistory.push(message);
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.insertAdjacentHTML('beforeend', this.createMessageHtml(message));
            this.scrollToBottom();
        }
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const typingHtml = `
            <div class="chat-message bot" id="typing-indicator">
                <div class="message-bubble bot">
                    <i class="fas fa-robot me-2"></i>
                    <span class="typing-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </span>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', typingHtml);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Scroll to bottom of chat
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    /**
     * Clear chat
     */
    clearChat() {
        this.chatHistory = [];
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="chat-message bot">
                    <div class="message-bubble bot">
                        <i class="fas fa-robot me-2"></i>
                        Hello! I'm your medical assistant. How can I help you today? 
                        I can provide information about symptoms, medications, emergency procedures, 
                        and help you find nearby medical facilities.
                    </div>
                </div>
            `;
        }
    }

    /**
     * Handle quick actions
     */
    handleQuickAction(action) {
        const messages = {
            'emergency': "I have chest pain and can't breathe - is this an emergency?",
            'medications': "What can you tell me about aspirin medication?",
            'first-aid': "I have a cut on my finger - what first aid should I do?",
            'nearby-hospitals': "I need to schedule an appointment with a doctor"
        };

        const message = messages[action];
        if (message) {
            document.getElementById('chat-input').value = message;
            this.sendMessage();
        }
    }

    /**
     * Find nearest ER
     */
    findNearestER() {
        if (window.app) {
            window.app.navigateToTab('hospital');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Send message button
        const sendBtn = document.getElementById('send-message');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Chat input enter key
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Clear chat button
        const clearBtn = document.getElementById('clear-chat');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearChat();
            });
        }

        // Quick action buttons
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });

        // Find nearest ER button
        const findERBtn = document.getElementById('find-nearest-er');
        if (findERBtn) {
            findERBtn.addEventListener('click', () => {
                this.findNearestER();
            });
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            const errorMessage = {
                id: Date.now(),
                message: `Error: ${message}`,
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            
            this.addMessageToChat(errorMessage);
        }
    }
}

// Make it globally available
window.ChatManager = ChatManager;

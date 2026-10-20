import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  RefreshCw,
  Trash2,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  Languages,
  ShieldCheck,
  ChevronDown,
  Minimize2,
  Maximize2,
  X,
  MessageSquare,
  Clock,
  CheckCircle,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import { aiApi } from '../../services/api.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  language?: string;
  is_fallback?: boolean;
}

interface AIChatWindowProps {
  isEmbedded?: boolean;
  onClose?: () => void;
  initialPrompt?: string;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({
  isEmbedded = false,
  onClose,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<'en' | 'kn' | 'hi'>('en');
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(20);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<'all' | 'equipment' | 'schemes' | 'livestock' | 'weather'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recog.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recog.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, [language]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
        setIsListening(false);
      }
    }
  };

  // Quick prompt suggestions with categories
  const allSuggestions = [
    {
      category: 'equipment',
      label: '🚜 Tractors under ₹1000/hr',
      prompt: 'Find available tractors for rent under ₹1000 per hour in Karnataka',
    },
    {
      category: 'equipment',
      label: '🌾 Paddy Harvester Rates',
      prompt: 'Compare combine harvester rental rates and driver charges for paddy harvest.',
    },
    {
      category: 'schemes',
      label: '📜 Drip Irrigation Subsidy',
      prompt: 'Which Karnataka government schemes provide subsidies for drip irrigation or solar pumps?',
    },
    {
      category: 'schemes',
      label: '💰 Raitha Siri Scheme Eligibility',
      prompt: 'What are the eligibility criteria and documents needed for the Raitha Siri millet incentive scheme?',
    },
    {
      category: 'livestock',
      label: '🐄 Dairy Cow Feed & Care',
      prompt: 'What is the optimal feed schedule and vaccination care for high milk yield dairy cows?',
    },
    {
      category: 'livestock',
      label: '🐔 Poultry Vaccination Schedule',
      prompt: 'What is the recommended vaccination chart for commercial broiler and country chicken farming?',
    },
    {
      category: 'weather',
      label: '🌱 Soil Prep & Kharif Sowing',
      prompt: 'What are the best soil preparation practices and crop choices for the upcoming Kharif season?',
    },
    {
      category: 'weather',
      label: '🌦️ Rain & Pest Advisory',
      prompt: 'How to protect standing crops from fungal blast during unseasonal rainfall and high humidity?',
    },
  ];

  const suggestions =
    selectedQuickCategory === 'all'
      ? allSuggestions
      : allSuggestions.filter((s) => s.category === selectedQuickCategory);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            language === 'kn'
              ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ **ಕಿಸಾನ್ ಮಿತ್ರ (AgroRent AI ಸಹಾಯಕ)**. ಯಂತ್ರೋಪಕರಣಗಳ ಬಾಡಿಗೆ, ಹೈನುಗಾರಿಕೆ ಹಸುಗಳು, ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಅಥವಾ ಕೃಷಿ ಸಲಹೆಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ!'
              : 'Hello! I am your **Kisan Sathi (AgroRent AI Assistant)**. Ask me anything about farm machinery rentals, livestock listings, government subsidies, or agricultural best practices!',
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }, [language]);

  // Handle initial prompt if provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Fetch current rate limit status
  const fetchRateLimit = async () => {
    try {
      const res = await aiApi.getRateLimitStatus();
      if (res.data?.success && res.data?.data) {
        setRateLimitRemaining(res.data.data.remaining);
      }
    } catch {
      // Ignore if offline
    }
  };

  useEffect(() => {
    fetchRateLimit();
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText('');
    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
      language,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await aiApi.sendMessage({
        message: query,
        conversation_id: conversationId,
        language,
      });

      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        if (d.conversation_id) {
          setConversationId(d.conversation_id);
        }

        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: d.reply,
          created_at: new Date().toISOString(),
          is_fallback: d.is_fallback,
        };

        setMessages((prev) => [...prev, botMessage]);
        fetchRateLimit();
      } else {
        throw new Error(res.data?.message || 'Unable to receive response');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      setErrorMessage(msg);

      const errorMessageObj: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Notice:** ${msg}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content:
          language === 'kn'
            ? 'ಹೊಸ ಚಾಟ್ ಪ್ರಾರಂಭವಾಗಿದೆ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?'
            : 'Conversation reset. How can I assist your farming operations today?',
        created_at: new Date().toISOString(),
      },
    ]);
    setConversationId(undefined);
    setErrorMessage(null);
  };

  return (
    <div
      className={`flex flex-col bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ${
        isEmbedded ? 'w-full h-[650px]' : 'w-full max-w-2xl h-[620px] fixed bottom-4 right-4 z-50'
      }`}
    >
      {/* Header */}
      <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 border border-emerald-500 flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-base leading-tight">
                {language === 'kn' ? 'ಕಿಸಾನ್ ಮಿತ್ರ AI' : 'Kisan Sathi AI'}
              </h3>
              <span className="text-[10px] font-medium bg-emerald-800 text-emerald-100 px-1.5 py-0.5 rounded border border-emerald-600">
                AI Assistant
              </span>
            </div>
            <p className="text-xs text-emerald-100">
              {language === 'kn'
                ? 'ಕೃಷಿ ಸಲಹೆಗಾರ ಮತ್ತು ಉಪಕರಣ ಶಿಫಾರಸು'
                : 'Agricultural Intelligence & Smart Advisory'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language selector */}
          <div className="flex items-center bg-emerald-800/80 rounded-md p-0.5 border border-emerald-600 text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded transition ${
                language === 'en' ? 'bg-white text-emerald-900 font-semibold' : 'text-emerald-100 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('kn')}
              className={`px-2 py-0.5 rounded transition ${
                language === 'kn' ? 'bg-white text-emerald-900 font-semibold' : 'text-emerald-100 hover:text-white'
              }`}
            >
              ಕನ್ನಡ
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded transition ${
                language === 'hi' ? 'bg-white text-emerald-900 font-semibold' : 'text-emerald-100 hover:text-white'
              }`}
            >
              Hinglish
            </button>
          </div>

          <button
            onClick={handleClearChat}
            title="Reset Conversation"
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-600 rounded transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close Chat"
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-600 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-xs text-amber-800 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {language === 'kn'
              ? 'ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ: AI ನೇರವಾಗಿ ಹಣ ಪಾವತಿ ಅಥವಾ ಬುಕಿಂಗ್ ಮಾಡುವುದಿಲ್ಲ. ಅಧಿಕೃತ ದೃಢೀಕರಣ ಅಗತ್ಯ.'
              : 'Advisory Mode: AI does not execute payments or bookings directly. Direct confirmation required.'}
          </span>
        </div>
        <span className="text-[11px] font-medium text-amber-700">
          {rateLimitRemaining}/20 hr
        </span>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
                  isUser ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-800 break-words">
                    <Markdown>{msg.content}</Markdown>
                    {msg.is_fallback && (
                      <div className="mt-2 pt-1 border-t border-gray-100 flex items-center text-[11px] text-gray-400">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mr-1 inline" />
                        Answered via verified AgroRent offline knowledge base
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-gray-500 ml-2">
                {language === 'kn' ? 'ಉತ್ತರವನ್ನು ತಯಾರಿಸುತ್ತಿದೆ...' : 'Analyzing farm records & database...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Category Tabs & Suggestion Chips */}
      <div className="px-3 py-2 bg-white border-t border-gray-100 space-y-1.5">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'equipment', label: '🚜 Machinery' },
            { id: 'schemes', label: '📜 Subsidies' },
            { id: 'livestock', label: '🐄 Livestock' },
            { id: 'weather', label: '🌦️ Weather' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedQuickCategory(cat.id as any)}
              className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition ${
                selectedQuickCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s.prompt)}
              disabled={isLoading}
              className="text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-full transition text-left cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? language === 'kn'
                    ? 'ಆಲಿಸುತ್ತಿದೆ... ಮಾತನಾಡಿ...'
                    : 'Listening... speak now...'
                  : language === 'kn'
                  ? 'ನಿಮ್ಮ ಕೃಷಿ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...'
                  : 'Ask about machinery, cattle, schemes, or delivery status...'
              }
              disabled={isLoading}
              className={`w-full pl-3.5 pr-10 py-2.5 text-sm bg-gray-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition ${
                isListening ? 'border-red-500 ring-2 ring-red-300 bg-red-50/30' : 'border-gray-300'
              }`}
            />
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Stop voice listening' : 'Speak your question (Kannada / English)'}
              className={`absolute right-2 p-1.5 rounded-full transition ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-gray-400 hover:text-emerald-700 hover:bg-gray-100'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 transition shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'kn' ? 'ಕಳುಹಿಸಿ' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

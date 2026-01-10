import React, { useState, useEffect, useRef } from 'react';
import { TripDay, Message } from '../types';
import { generateConciergeResponse } from '../services/geminiService';

interface AIChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    dayContext: TripDay | null;
    initialQuery?: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, dayContext, initialQuery }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: 'היי! אני העוזר החכם לטיול שוויץ 2025. איך אפשר לעזור היום?',
            sender: 'bot',
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Handle initial query (e.g., from "Analyze Day" button)
    useEffect(() => {
        if (isOpen && initialQuery) {
            handleSend(initialQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialQuery]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: textToSend,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const responseText = await generateConciergeResponse(
                textToSend,
                messages.map(m => ({ role: m.sender, text: m.text })),
                dayContext || undefined
            );

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full h-[85vh] sm:h-[600px] sm:max-w-md sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <div>
                            <h3 className="font-bold">היועץ החכם (Gemini)</h3>
                            <p className="text-xs text-blue-100">
                                {dayContext ? `בהקשר: ${dayContext.title}` : 'מחובר לנתוני הטיול'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                                msg.sender === 'user' 
                                    ? 'bg-red-500 text-white self-start rounded-br-sm' 
                                    : 'bg-white text-slate-700 border border-slate-200 self-end rounded-bl-sm shadow-sm'
                            }`}
                        >
                            <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                        </div>
                    ))}
                    {isLoading && (
                        <div className="self-end bg-white border border-slate-200 px-4 py-3 rounded-xl rounded-bl-sm shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="שאל משהו על הטיול..."
                            className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                            dir="rtl"
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={isLoading}
                            className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-md"
                        >
                            <span className="material-symbols-outlined text-sm">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
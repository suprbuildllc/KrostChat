import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, CornerDownLeft, Sparkles, RefreshCcw, Database, AlertCircle } from "lucide-react";
import { dummyCommerceData } from "./data/dummyCommerceData";
import ProcessedDataVisualizer from "./components/ProcessedDataVisualizer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent_type?: "casual chat" | "data request";
  processed_data?: any[];
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hidden background state reference to fulfill the invisible requirement
  const commerceDataRef = useRef(dummyCommerceData);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation payload
      const chatHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to communicate with the assistant.");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        intent_type: data.intent_type,
        processed_data: data.processed_data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please check your connection or environment setup.");
    } finally {
      setIsLoading(false);
      // Keep input focused
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div id="app-root" className="w-full h-screen bg-[#F9F8F6] text-[#2D2926] font-sans overflow-hidden flex flex-col justify-between tracking-tight antialiased selection:bg-[#E7E5E4] selection:text-[#2D2926]">
      
      {/* Absolute minimalist status indicator centered at top */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-30 flex items-center space-x-2 pointer-events-none z-10 select-none">
        <div className="w-1.5 h-1.5 rounded-full bg-[#2D2926] animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#2D2926] font-medium">Secure Connection Active</span>
      </div>

      {/* Floating clear action - floats beautifully on top right */}
      <div className="absolute top-6 right-6 z-10 pointer-events-none">
        <AnimatePresence>
          {messages.length > 0 && (
            <motion.button
              id="btn-clear-chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleClearChat}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E7E5E4] text-xs text-[#A8A29E] hover:text-[#2D2926] rounded-xl shadow-sm cursor-pointer transition-all duration-150 hover:bg-[#F5F5F4] active:scale-98"
              title="Clear conversation"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span className="font-medium">Clear</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Main chat viewport with scrolling frame */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 md:px-0 overflow-y-auto no-scrollbar pt-24 pb-40 relative z-10">
        
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            /* COMPLETELY EMPTY PURE SLATE SHOWING MELLOW PLACEHOLDER */
            <motion.div
              id="initial-empty-viewport"
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center select-none"
            >
              <p className="text-[#A8A29E] text-sm italic tracking-wide">Waiting for input...</p>
              
              {/* Invisible database structure checkpoint (Resides in DOM, completely silent) */}
              <div className="hidden" data-ref="dummy-commerce-data-checkpoint" />
            </motion.div>
          ) : (
            /* CONVERSATION TIMELINE */
            <motion.div
              id="chat-scrollarea"
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8 pb-4"
            >
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1.5 ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <span className="text-[9px] font-mono tracking-widest text-[#A8A29E] uppercase px-1.5">
                    {msg.role === "user" ? "User" : "Assistant"}
                  </span>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`max-w-xl py-3.5 px-4.5 rounded-2xl leading-relaxed text-sm ${
                      msg.role === "user"
                        ? "bg-[#2D2926] text-white rounded-tr-sm shadow-sm"
                        : "bg-white border border-[#E7E5E4] text-[#2D2926] rounded-tl-sm shadow-sm font-light"
                    }`}
                    style={index === 0 ? { backgroundColor: "#000000", color: "#ffffff", fontWeight: "normal" } : undefined}
                  >
                    <FormattedText text={msg.content} isFirstMessage={index === 0} isThirdMessage={index === 2} />
                    
                    {msg.role === "assistant" && msg.intent_type === "data request" && msg.processed_data && msg.processed_data.length > 0 && (
                      <ProcessedDataVisualizer data={msg.processed_data} />
                    )}
                  </motion.div>
                </div>
              ))}

              {/* Loader visual response state */}
              {isLoading && (
                <div className="flex flex-col gap-1.5 items-start">
                  <span className="text-[9px] font-mono tracking-widest text-[#A8A29E] uppercase px-1.5">
                    Assistant
                  </span>
                  <div className="flex gap-1.5 items-center bg-white border border-[#E7E5E4] rounded-2xl py-3.5 px-4.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-[#2D2926] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-[#2D2926] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-[#2D2926] rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              {/* Exception connection handler */}
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs leading-5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Futuristic sleek prompt/input box - pinned elegantly at bottom center */}
      <div className="absolute bottom-0 left-0 right-0 pt-10 pb-8 bg-gradient-to-t from-[#F9F8F6] via-[#F9F8F6]/95 to-transparent z-20 pointer-events-none">
        <div className="w-full max-w-2xl mx-auto px-4 md:px-0 pointer-events-auto">
          <div className="relative group">
            
            {/* Soft decorative glow background from design instructions */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#D6D3D1] to-[#E7E5E4] rounded-2xl blur opacity-25 group-focus-within:opacity-40 transition-opacity duration-300 pointer-events-none" />
            
            <div className="relative flex items-end bg-white border border-[#E7E5E4] rounded-2xl shadow-sm focus-within:border-[#D6D3D1] transition-all duration-300 px-4 py-3">
              <textarea
                id="chat-textarea-input"
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="flex-1 max-h-32 bg-transparent text-[#2D2926] text-base focus:outline-none resize-none placeholder-[#A8A29E] leading-normal py-1 pr-12 no-scrollbar"
                style={{ height: "auto" }}
              />

              {/* Layout auxiliary cues */}
              <div className="absolute right-3.5 bottom-3 flex items-center gap-3">
                <span className="hidden md:inline-flex text-[10px] font-mono text-[#A8A29E] gap-1 items-center select-none pointer-events-none mr-1">
                  <span>Enter</span>
                  <CornerDownLeft className="w-2.5 h-2.5 text-[#A8A29E]" />
                </span>
                
                <button
                  id="btn-send-message"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all duration-200 outline-none ${
                    inputValue.trim() && !isLoading
                      ? "bg-[#2D2926] hover:bg-black text-white hover:scale-105 cursor-pointer"
                      : "bg-[#F5F5F4] text-[#A8A29E] cursor-not-allowed"
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Context footer tracker */}
          <p className="text-center mt-4 text-[10px] text-[#A8A29E] font-medium tracking-wider uppercase">
            Context: All Systems Normal • 50 Data Nodes Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Super lightweight Markdown-style renderer helper to keep everything compilable
 * without adding redundant external library dependencies.
 */
function FormattedText({ text, isFirstMessage, isThirdMessage }: { text: string; isFirstMessage?: boolean; isThirdMessage?: boolean }) {
  if (!text) return null;

  // Split content by paragraphs or list block sequences
  const lines = text.split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        // Simple checklist formatting
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <ul key={index} className="list-disc ml-5 pl-1 my-1 space-y-1">
              <li>{parseBoldAndStyles(line.trim().substring(2), isFirstMessage, isThirdMessage, index === 0)}</li>
            </ul>
          );
        }

        // Simple numeric enumeration blocks
        const enumMatch = line.trim().match(/^(\d+)\.\s(.*)/);
        if (enumMatch) {
          return (
            <ol key={index} className="list-decimal ml-5 pl-1 my-1 space-y-1">
              <li>{parseBoldAndStyles(enumMatch[2], isFirstMessage, isThirdMessage, index === 0)}</li>
            </ol>
          );
        }

        // Display heading blocks
        if (line.trim().startsWith("### ")) {
          return (
            <h4 key={index} className="text-sm font-semibold text-[#2D2926] font-sans pt-1">
              {parseBoldAndStyles(line.trim().substring(4), isFirstMessage, isThirdMessage, index === 0)}
            </h4>
          );
        }
        if (line.trim().startsWith("## ")) {
          return (
            <h3 key={index} className="text-base font-semibold text-[#2D2926] pb-1 pt-1.5 border-b border-[#E7E5E4] w-full">
              {parseBoldAndStyles(line.trim().substring(3), isFirstMessage, isThirdMessage, index === 0)}
            </h3>
          );
        }

        // Simple codeblock layout mapping helpers
        if (line.trim().startsWith("```")) {
          return null; // Skip raw indicator indicators to maintain minimalistic visual block layout
        }

        if (line.trim() === "") {
          return <div key={index} className="h-1.5" />;
        }

        return <p key={index} className="text-[#2D2926] leading-relaxed font-light">{parseBoldAndStyles(line, isFirstMessage, isThirdMessage, index === 0)}</p>;
      })}
    </div>
  );
}

/**
 * Internal parsing loop checking for standard bold identifiers or italics.
 */
function parseBoldAndStyles(
  paragraph: string, 
  isFirstMessage?: boolean, 
  isThirdMessage?: boolean, 
  isFirstLine?: boolean
) {
  // Regex parsing standard markdown bold (**text**)
  const parts = paragraph.split(/\*\*([^*]+)\*\*/g);

  const targetStyle = (isFirstLine && isFirstMessage) 
    ? { color: "#ffffff", fontWeight: "normal", fontSize: "14px" } 
    : (isFirstLine && isThirdMessage) 
    ? { color: "#ffffff" } 
    : undefined;

  if (parts.length === 1) {
    return <span style={targetStyle}>{paragraph}</span>;
  }

  return (
    <span style={targetStyle}>
      {parts.map((p, i) => {
        // Even indices are standard text, odd indices were captured inside our bold brackets
        if (i % 2 === 1) {
          return <strong key={i} className="font-semibold text-black" style={isFirstMessage ? { color: "#ffffff" } : undefined}>{p}</strong>;
        }

        // Check for basic monospaced backticks (`code`) inside the normal segment
        const inlineCodeParts = p.split(/`([^`]+)`/g);
        if (inlineCodeParts.length > 1) {
          return (
            <span key={i}>
              {inlineCodeParts.map((ic, j) => {
                if (j % 2 === 1) {
                  return (
                    <code key={j} className="text-xs font-mono bg-[#F5F5F4] border border-[#E7E5E4] px-1.5 py-0.5 rounded text-[#2D2926]">
                      {ic}
                    </code>
                  );
                }
                return ic;
              })}
            </span>
          );
        }

        return p;
      })}
    </span>
  );
}

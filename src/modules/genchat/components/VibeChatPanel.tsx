'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, Loader2, Trash2, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVibeChat } from '@/contexts/VibeChatContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function VibeChatPanel() {
  const router = useRouter();
  const { isOpen, messages, isProcessing, closePanel, sendMessage, clearHistory } = useVibeChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleLinkClick = (href: string) => {
    router.push(href);
    closePanel();
  };

  // Format message content with markdown-like styling
  const formatContent = (content: string) => {
    // Handle bold text
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Handle bullet points
      if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-blue-500">•</span>
            <span>{formatInlineStyles(line.replace(/^[•-]\s*/, ''))}</span>
          </div>
        );
      }
      return <div key={i}>{formatInlineStyles(line)}</div>;
    });
  };

  const formatInlineStyles = (text: string) => {
    // Handle **bold** text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-full bg-white border-l shadow-xl z-40 flex flex-col transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
        'w-full sm:w-[400px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">Vibe Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearHistory}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
            title="Clear history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={closePanel}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5',
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                )}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {formatContent(message.content)}
                </div>

                {/* Links */}
                {message.links && message.links.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.links.map((link, i) => (
                      <button
                        key={i}
                        onClick={() => handleLinkClick(link.href)}
                        className={cn(
                          'flex items-center gap-2 text-sm font-medium w-full',
                          message.role === 'user'
                            ? 'text-white/90 hover:text-white'
                            : 'text-blue-600 hover:text-blue-700'
                        )}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {link.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button type="submit" disabled={isProcessing || !input.trim()} size="icon">
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Try: &quot;Create a job for React Developer&quot;
        </p>
      </div>
    </div>
  );
}

'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVibeChat } from '@/contexts/VibeChatContext';
import { cn } from '@/lib/utils';

export function VibeChatToggle() {
  const { isOpen, togglePanel } = useVibeChat();

  return (
    <Button
      onClick={togglePanel}
      className={cn(
        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30',
        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
        'transition-all duration-300',
        isOpen && 'opacity-0 pointer-events-none'
      )}
      size="icon"
    >
      <Sparkles className="h-6 w-6 text-white" />
    </Button>
  );
}

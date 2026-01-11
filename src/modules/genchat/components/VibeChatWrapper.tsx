'use client';

import { ReactNode } from 'react';
import { VibeChatProvider, useVibeChat } from '@/contexts/VibeChatContext';
import { VibeChatPanel } from './VibeChatPanel';
import { VibeChatToggle } from './VibeChatToggle';
import { cn } from '@/lib/utils';

function VibeChatContent({ children }: { children: ReactNode }) {
  const { isOpen } = useVibeChat();

  return (
    <div className="flex h-screen bg-slate-50">
      <div
        className={cn(
          'flex-1 flex transition-all duration-300 ease-in-out',
          isOpen && 'sm:mr-[400px]'
        )}
      >
        {children}
      </div>
      <VibeChatPanel />
      <VibeChatToggle />
    </div>
  );
}

export function VibeChatWrapper({ children }: { children: ReactNode }) {
  return (
    <VibeChatProvider>
      <VibeChatContent>{children}</VibeChatContent>
    </VibeChatProvider>
  );
}

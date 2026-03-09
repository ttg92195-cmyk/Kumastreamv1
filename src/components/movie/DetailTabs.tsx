'use client';

import { useState } from 'react';
import { FileText, Play, Download, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const defaultTabs: Tab[] = [
  { id: 'detail', label: 'Detail', icon: FileText },
  { id: 'stream', label: 'Stream', icon: Play },
  { id: 'download', label: 'Download', icon: Download },
  { id: 'explore', label: 'Explore', icon: Compass },
];

interface DetailTabsProps {
  tabs?: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
}

export function DetailTabs({ tabs = defaultTabs, defaultTab = 'detail', children }: DetailTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-[#262626] overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap',
                isActive
                  ? 'bg-red-500/20 text-red-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive && 'text-red-500')} />
              <span className={cn('text-sm font-medium', isActive && 'text-red-500')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {children(activeTab)}
      </div>
    </div>
  );
}

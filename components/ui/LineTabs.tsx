import React from 'react';
import { motion } from 'motion/react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface LineTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  layoutId: string;
  color?: string; // e.g., '#05469B'
}

export const LineTabs: React.FC<LineTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  layoutId,
  color = '#05469B'
}) => {
  return (
    <div className="flex border-b border-gray-200 overflow-x-auto custom-scrollbar shrink-0 px-1 gap-6 select-none bg-transparent w-full">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="relative py-3 text-sm font-black transition-colors flex items-center gap-2 outline-none cursor-pointer text-gray-400 hover:text-gray-700 whitespace-nowrap"
            style={{ color: isActive ? color : undefined }}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="relative z-10">{tab.label}</span>
            {tab.count !== undefined && (
              <span 
                className="px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors"
                style={{ 
                  backgroundColor: isActive ? `${color}15` : '#f3f4f6', 
                  color: isActive ? color : '#9ca3af' 
                }}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full z-0"
                style={{ backgroundColor: color }}
                transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default LineTabs;

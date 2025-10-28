import React from 'react';
import { Lightbulb, Zap, Target } from 'lucide-react';

type CalloutType = 'insight' | 'counterintuitive' | 'opportunity';

interface CalloutBoxProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const calloutConfig = {
  insight: {
    icon: Lightbulb,
    defaultTitle: 'Key Insight',
    bgColor: 'rgba(120, 35, 220, 0.1)',
    borderColor: '#C8A5F0',
    iconColor: '#C8A5F0',
  },
  counterintuitive: {
    icon: Zap,
    defaultTitle: 'Counterintuitive Finding',
    bgColor: 'rgba(200, 165, 240, 0.1)',
    borderColor: '#7823DC',
    iconColor: '#7823DC',
  },
  opportunity: {
    icon: Target,
    defaultTitle: 'Hidden Opportunity',
    bgColor: 'rgba(120, 35, 220, 0.1)',
    borderColor: '#C8A5F0',
    iconColor: '#C8A5F0',
  },
};

export default function CalloutBox({ type, title, children }: CalloutBoxProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className="p-6 rounded-lg mb-6"
      style={{
        backgroundColor: config.bgColor,
        borderLeft: `4px solid ${config.borderColor}`,
      }}
    >
      <div className="flex items-start space-x-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: config.borderColor }}
        >
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-text-primary font-semibold text-lg mb-2">
            {title || config.defaultTitle}
          </h4>
          <div className="text-text-secondary text-base leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

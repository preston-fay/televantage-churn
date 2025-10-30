import React from 'react';
import TabNavigation from './TabNavigation';

export default function Header() {
  return (
    <header className="bg-bg-secondary border-b border-border-primary sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold text-text-primary leading-tight">
              ChurnIQ Intelligence Platform
            </h1>
            <p className="text-sm text-text-tertiary mt-0.5">
              AI-Powered Customer Retention Analytics
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-sm text-text-tertiary">47.3M Customers</div>
              <div className="text-xs text-text-tertiary">#7 US Carrier</div>
            </div>
            <img
              src="/kearney_logo.jpg"
              alt="Kearney"
              className="w-auto"
              style={{ height: '29px' }}
            />
          </div>
        </div>
        <TabNavigation />
      </div>
    </header>
  );
}

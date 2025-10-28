import React from 'react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Dashboard' },
  { path: '/scenarios', label: 'Scenarios' },
  { path: '/workflow', label: 'AI Intelligence' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/segments', label: 'Segments' },
];

export default function TabNavigation() {
  return (
    <nav className="flex space-x-1">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          className={({ isActive }) =>
            `tab ${isActive ? 'tab-active' : ''}`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

import React, { useEffect, useState } from 'react';
import { Sparkles, BarChart3, TrendingUp, Users } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import StrategyCopilot from '@/components/copilot/StrategyCopilot';
import { aiService } from '@/services/aiService';

export default function AIPoweredIntelligence() {
  const { data } = useAppContext();
  const [stats, setStats] = useState({
    segments: 0,
    features: 0,
    customers: 0
  });

  // Initialize AI service with knowledge base
  useEffect(() => {
    if (data) {
      aiService.setContext(data);
      setStats({
        segments: data.segments.length,
        features: data.feature_importance.features.length,
        customers: data.metrics.overview.total_customers
      });
    }
  }, [data]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-3">
          <Sparkles size={32} className="text-text-primary" style={{ color: 'var(--color-accent-primary)' }} />
          <h2 className="text-4xl font-bold text-text-primary">Strategy Copilot</h2>
        </div>
        <p className="text-text-secondary text-xl leading-relaxed">
          Ask questions about customer segments, churn drivers, and retention strategies. Get instant insights with data visualizations powered by our multi-agent analytics platform.
        </p>
      </div>

      {/* Knowledge Base Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <Users size={24} className="text-text-tertiary" />
            <div className="text-text-tertiary text-xs font-semibold uppercase">Knowledge Base</div>
          </div>
          <div className="text-3xl font-bold text-text-primary mb-1">
            {(stats.customers / 1_000_000).toFixed(1)}M
          </div>
          <div className="text-text-tertiary text-sm">Customers Analyzed</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 size={24} className="text-text-tertiary" />
            <div className="text-text-tertiary text-xs font-semibold uppercase">Segments</div>
          </div>
          <div className="text-3xl font-bold text-text-primary mb-1">{stats.segments}</div>
          <div className="text-text-tertiary text-sm">Customer Cohorts Indexed</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={24} className="text-text-tertiary" />
            <div className="text-text-tertiary text-xs font-semibold uppercase">Features</div>
          </div>
          <div className="text-3xl font-bold text-text-primary mb-1">{stats.features}</div>
          <div className="text-text-tertiary text-sm">Churn Drivers Analyzed</div>
        </div>
      </div>

      {/* Main Copilot Interface */}
      <div className="card border-2 p-0" style={{ borderColor: 'var(--color-accent-primary)' }}>
        <div className="h-[700px]">
          <StrategyCopilot embedded />
        </div>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <h3 className="text-xl font-semibold text-text-primary mb-4">What You Can Ask</h3>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex items-start">
              <span className="mr-3 mt-1 text-lg" style={{ color: 'var(--color-accent-primary)' }}>•</span>
              <div>
                <strong className="text-text-primary">Risk Analysis:</strong> "Show me customer risk distribution" or "Why is the Medium Risk segment so large?"
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-1 text-lg" style={{ color: 'var(--color-accent-primary)' }}>•</span>
              <div>
                <strong className="text-text-primary">Segment Deep-Dives:</strong> "Tell me about month-to-month customers" or "What about early-tenure customers?"
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-1 text-lg" style={{ color: 'var(--color-accent-primary)' }}>•</span>
              <div>
                <strong className="text-text-primary">Churn Drivers:</strong> "What are the top churn drivers?" or "Show me feature importance"
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-1 text-lg" style={{ color: 'var(--color-accent-primary)' }}>•</span>
              <div>
                <strong className="text-text-primary">ROI Comparisons:</strong> "Compare ROI across all strategies" or "What's the optimal retention budget?"
              </div>
            </li>
          </ul>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Powered By Multi-Agent AI</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                <BarChart3 size={16} className="text-white" />
              </div>
              <div>
                <div className="text-text-primary font-semibold text-sm">Data Agent</div>
                <div className="text-text-tertiary text-sm">Validates and segments customer data across 54 cohorts</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <div className="text-text-primary font-semibold text-sm">ML Agent</div>
                <div className="text-text-tertiary text-sm">Predicts churn with 85% accuracy (AUC 0.85)</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <div className="text-text-primary font-semibold text-sm">Strategy Agent</div>
                <div className="text-text-tertiary text-sm">Generates retention strategies with ROI projections</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                <Users size={16} className="text-white" />
              </div>
              <div>
                <div className="text-text-primary font-semibold text-sm">QA Agent</div>
                <div className="text-text-tertiary text-sm">Validates outputs against business constraints</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

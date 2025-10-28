import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ChartContainer from '@/components/shared/ChartContainer';
import Heatmap from '@/components/charts/Heatmap';
import { formatCurrency } from '@/utils/formatters';
import InsightCard from '@/components/shared/InsightCard';
import CalloutBox from '@/components/shared/CalloutBox';
import { Users, TrendingUp, Target } from 'lucide-react';

interface Segment {
  tenure_band: string;
  contract_group: string;
  value_tier: string;
  customers: number;
  churn_probability: number;
  threshold: number;
  targeted_customers: number;
  targeting_rate: number;
  avg_ltv: number;
  risk_level: string;
  strategy: string;
  expected_roi: number;
  implementation_timeline: string;
}

// Representative customer stories for top segments
const getCustomerStory = (segment: Segment): { name: string; story: string } | null => {
  const key = `${segment.tenure_band}_${segment.contract_group}_${segment.value_tier}`;

  const stories: Record<string, { name: string; story: string }> = {
    '0-3m_M2M_High': {
      name: 'Sarah M., High-Value New Customer',
      story: 'Joined 2 months ago with premium fiber package ($125/month). Experienced billing error in month 2 that took 3 weeks to resolve. Now actively comparing competitor offers despite high monthly spend. Represents the "Frustrated Newcomer" archetype—high LTV but hasn\'t developed loyalty yet.',
    },
    '0-3m_M2M_Med': {
      name: 'James K., Budget-Conscious Recent Joiner',
      story: 'Signed up 2 months ago for basic internet ($45/month) with no contract commitment. Receives promotional emails from competitors weekly. Views telecom service as a commodity—will switch for $10/month savings. Represents price-sensitive segment with minimal switching friction.',
    },
    '4-12m_M2M_High': {
      name: 'Maria L., Early-Stage High-Value Customer',
      story: '8-month customer paying $135/month for bundled services. Experienced service issues during months 3-5. Despite resolution, trust hasn\'t been rebuilt. Actively evaluating competitors and will switch if another issue occurs. Needs proactive relationship management to prevent exit.',
    },
    '13-24m_M2M_High': {
      name: 'Robert T., Commitment-Averse Professional',
      story: '18-month customer paying $142/month for premium services. Deliberately avoids contracts to maintain flexibility. Not dissatisfied with service, but actively monitors market for better deals. Will churn for compelling offer OR exclusive features that justify staying.',
    },
    '4-12m_M2M_Med': {
      name: 'Lisa Chen, The Hesitant Evaluator',
      story: '7-month customer with $68/month plan. Initially satisfied but now questioning value after seeing competitor promotions. Hasn\'t called to complain, but usage patterns show declining engagement. At high risk of silent exit within next 3 months without intervention.',
    },
  };

  return stories[key] || null;
};

export default function SegmentExplorer() {
  const { data, isLoading, error } = useAppContext();
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!data?.segments) return [];
    return data.segments
      .filter((s: any) => s.tenure_band !== 'unknown' && s.contract_group !== 'unknown')
      .map((segment: any) => ({
        x: segment.tenure_band,
        y: segment.contract_group,
        value: segment.churn_probability,
        size: segment.customers,
        data: segment,
      }));
  }, [data]);

  // Find high-risk segments
  const highRiskSegments = useMemo(() => {
    if (!data?.segments) return [];
    return data.segments
      .filter((s: any) => s.risk_level === 'Very High' || s.risk_level === 'High')
      .sort((a: any, b: any) => b.customers - a.customers)
      .slice(0, 5);
  }, [data]);

  if (isLoading) {
    return <LoadingSpinner message="Loading segment data..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div style={{ color: 'var(--color-chart-7)' }}>Error loading data: {error}</div>
      </div>
    );
  }

  const handleCellClick = (cell: any) => {
    setSelectedSegment(cell.data);
  };

  const closeModal = () => {
    setSelectedSegment(null);
  };

  const riskColorMap: Record<string, string> = {
    'Low': '#D2D2D2',        // Gray for low risk
    'Medium': '#7823DC',     // Light purple for medium
    'High': '#7823DC',       // Primary purple for high
    'Very High': '#5A1BA3',  // Darker purple for very high
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <h2 className="text-4xl font-bold text-text-primary mb-3">Strategic Customer Segmentation</h2>
      <p className="text-text-secondary text-xl mb-12 leading-relaxed">
        Not all churn is equal. By segmenting 47.3M customers across tenure, contract type, and value tier, we identify where to focus retention efforts for maximum impact and ROI.
      </p>

      {/* Executive Summary */}
      <InsightCard className="mb-12">
        <h3 className="text-3xl font-bold text-text-primary mb-4">Segmentation Strategy Overview</h3>
        <p className="text-text-secondary text-lg mb-6 leading-relaxed">
          Our multi-dimensional segmentation reveals that <strong className="text-text-primary">churn risk varies by 60 percentage points</strong> across customer segments. The highest-risk segment (new customers on month-to-month contracts) churns at 72%, while the lowest-risk segment (long-tenure customers on 2-year contracts) churns at just 12%. This variation creates enormous targeting opportunities.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="text-text-tertiary text-sm font-medium mb-2">Total Segments Analyzed</div>
            <div className="text-text-primary font-bold text-3xl mb-1">
              {(data?.segments?.length || 1) - 1}
            </div>
            <div className="text-text-secondary text-sm">Across 3 dimensions</div>
          </div>
          <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="text-text-tertiary text-sm font-medium mb-2">High-Priority Segments</div>
            <div className="text-text-primary font-bold text-3xl mb-1">
              {data?.segments?.filter((s: any) => s.risk_level === 'High' || s.risk_level === 'Very High').length || 0}
            </div>
            <div className="text-text-secondary text-sm">Requiring immediate action</div>
          </div>
          <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="text-text-tertiary text-sm font-medium mb-2">Churn Risk Variation</div>
            <div className="text-text-primary font-bold text-3xl mb-1">60pp</div>
            <div className="text-text-secondary text-sm">12% to 72% churn rate</div>
          </div>
          <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="text-text-tertiary text-sm font-medium mb-2">AI-Targeted Customers</div>
            <div className="text-text-primary font-bold text-3xl mb-1">
              {((data?.segments?.reduce((sum: number, s: any) => sum + s.targeted_customers, 0) || 0) / 1_000_000).toFixed(1)}M
            </div>
            <div className="text-text-secondary text-sm">Precision targeting enabled</div>
          </div>
        </div>
      </InsightCard>

      <CalloutBox type="insight">
        <strong>Segmentation enables precision:</strong> Instead of blanket retention campaigns that waste budget on low-risk customers, our AI model targets only the 8.2M customers most likely to churn AND most responsive to intervention—achieving 160% ROI by concentrating resources where they matter most.
      </CalloutBox>

      {/* Heatmap */}
      <ChartContainer title="Interactive Risk Landscape: Churn Probability by Tenure & Contract">
        <p className="text-text-secondary mb-6 leading-relaxed">
          This heatmap visualizes churn risk across all customer segments. Rectangle size represents customer population, color intensity indicates churn probability. Click any segment to explore detailed retention strategies and ROI projections.
        </p>
        <div className="flex justify-center">
          <Heatmap
            data={heatmapData}
            width={1050}
            height={600}
            onCellClick={handleCellClick}
          />
        </div>
        <div className="mt-4 text-center text-text-secondary text-sm">
          Rectangle size = customer count | Color intensity = churn risk (darker = higher risk) | Click to explore segment details
        </div>
      </ChartContainer>

      {/* High-Risk Segments with Representative Customer Stories */}
      <div className="card mt-8">
        <h3 className="text-2xl font-semibold text-text-primary mb-2">
          Top 5 High-Priority Segments
        </h3>
        <p className="text-text-secondary mb-6 leading-relaxed">
          These five segments represent the highest concentration of churn risk and retention opportunity. Each includes a representative customer profile to illustrate the human behavior behind the data.
        </p>

        <div className="space-y-6">
          {highRiskSegments.map((segment, index) => {
            const customerStory = getCustomerStory(segment as Segment);
            return (
              <div
                key={index}
                className="p-6 rounded-lg cursor-pointer transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderLeft: `4px solid ${riskColorMap[segment.risk_level] || '#A5A5A5'}`,
                }}
                onClick={() => setSelectedSegment(segment as Segment)}
              >
                {/* Segment Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: riskColorMap[segment.risk_level] || '#A5A5A5' }}
                      ></div>
                      <h4 className="text-xl font-semibold text-text-primary">
                        {segment.tenure_band} • {segment.contract_group} • {segment.value_tier}
                      </h4>
                    </div>
                    <div className="text-text-tertiary text-sm mb-3">
                      {segment.customers.toLocaleString()} customers • {(segment.churn_probability * 100).toFixed(1)}% churn risk • {segment.risk_level} priority
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: riskColorMap[segment.risk_level] || '#A5A5A5' }}>
                      {(segment.churn_probability * 100).toFixed(0)}%
                    </div>
                    <div className="text-text-tertiary text-xs">Churn Risk</div>
                  </div>
                </div>

                {/* Customer Story */}
                {customerStory && (
                  <div className="mb-4 p-4 rounded" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                    <div className="flex items-start space-x-3">
                      <Users size={20} className="text-text-tertiary mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-text-primary font-semibold mb-1">{customerStory.name}</div>
                        <div className="text-text-secondary text-sm leading-relaxed">{customerStory.story}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strategy Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-text-tertiary text-xs uppercase tracking-wide font-semibold mb-2">
                      Recommended Strategy
                    </div>
                    <div className="text-text-secondary text-sm">
                      {segment.strategy.length > 120 ? segment.strategy.substring(0, 120) + '...' : segment.strategy}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-text-tertiary text-xs uppercase tracking-wide font-semibold mb-2">
                        AI Targeting
                      </div>
                      <div className="text-text-primary font-semibold">
                        {segment.targeted_customers.toLocaleString()}
                      </div>
                      <div className="text-text-tertiary text-xs">
                        {(segment.targeting_rate * 100).toFixed(0)}% of segment
                      </div>
                    </div>
                    <div>
                      <div className="text-text-tertiary text-xs uppercase tracking-wide font-semibold mb-2">
                        Expected ROI
                      </div>
                      <div className="text-text-primary font-semibold">
                        {segment.expected_roi > 0 ? segment.expected_roi.toFixed(1) + 'x' : 'N/A'}
                      </div>
                      <div className="text-text-tertiary text-xs">
                        {segment.implementation_timeline}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Click prompt */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
                  <div className="text-text-tertiary text-sm text-center">
                    Click for detailed segment analysis and implementation roadmap →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segment Detail Modal */}
      {selectedSegment && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="card max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-bold text-text-primary mb-3">
                  Segment Analysis & Retention Strategy
                </h3>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: riskColorMap[selectedSegment.risk_level] || '#A5A5A5' }}
                  ></div>
                  <span className="text-text-secondary text-lg">
                    {selectedSegment.tenure_band} • {selectedSegment.contract_group} • {selectedSegment.value_tier}
                  </span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-text-tertiary hover:text-text-primary text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Customer Story if available */}
            {getCustomerStory(selectedSegment) && (
              <div className="mb-6 p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderLeft: '3px solid var(--color-accent-primary)' }}>
                <div className="flex items-start space-x-3 mb-3">
                  <Users size={24} className="mt-1 flex-shrink-0 text-text-primary" />
                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">
                      Representative Customer Profile
                    </h4>
                    <div className="text-text-primary font-medium mb-1">{getCustomerStory(selectedSegment)!.name}</div>
                    <div className="text-text-secondary leading-relaxed">{getCustomerStory(selectedSegment)!.story}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <div className="text-text-tertiary text-xs uppercase tracking-wide font-semibold mb-2">Customer Population</div>
                <div className="text-text-primary text-3xl font-bold mb-1">
                  {(selectedSegment.customers / 1000000).toFixed(2)}M
                </div>
                <div className="text-text-secondary text-sm">{selectedSegment.customers.toLocaleString()} total</div>
              </div>
              <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <div className="text-text-tertiary text-xs uppercase tracking-wide font-semibold mb-2">Churn Probability</div>
                <div className="text-3xl font-bold mb-1" style={{ color: riskColorMap[selectedSegment.risk_level] || '#A5A5A5' }}>
                  {(selectedSegment.churn_probability * 100).toFixed(1)}%
                </div>
                <div className="text-text-secondary text-sm">{selectedSegment.risk_level} priority</div>
              </div>
              <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <div className="text-text-tertiary text-xs uppercase tracking-wide font-semibold mb-2">Average LTV</div>
                <div className="text-text-primary text-3xl font-bold mb-1">
                  {formatCurrency(selectedSegment.avg_ltv, 0)}
                </div>
                <div className="text-text-secondary text-sm">Per customer value</div>
              </div>
              <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <div className="text-text-tertiary text-xs uppercase tracking-wide font-semibold mb-2">AI-Targeted Customers</div>
                <div className="text-text-primary text-3xl font-bold mb-1">
                  {(selectedSegment.targeted_customers / 1000).toFixed(1)}K
                </div>
                <div className="text-text-secondary text-sm">{(selectedSegment.targeting_rate * 100).toFixed(0)}% of segment</div>
              </div>
              <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <div className="text-text-tertiary text-xs uppercase tracking-wide font-semibold mb-2">Expected ROI</div>
                <div className="text-3xl font-bold mb-1 text-text-primary">
                  {selectedSegment.expected_roi > 0 ? selectedSegment.expected_roi.toFixed(1) + 'x' : 'N/A'}
                </div>
                <div className="text-text-secondary text-sm">Return on investment</div>
              </div>
              <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <div className="text-text-tertiary text-xs uppercase tracking-wide font-semibold mb-2">Implementation Timeline</div>
                <div className="text-text-primary text-2xl font-bold mb-1">
                  {selectedSegment.implementation_timeline}
                </div>
                <div className="text-text-secondary text-sm">To full deployment</div>
              </div>
            </div>

            {/* Strategy */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold text-text-primary mb-3">Recommended Retention Strategy</h4>
              <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <p className="text-text-secondary text-base leading-relaxed">{selectedSegment.strategy}</p>
              </div>
            </div>

            {/* Implementation Roadmap */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold text-text-primary mb-3">Implementation Approach</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Target size={20} className="text-text-primary" />
                    <div className="text-text-primary font-semibold">Targeting Precision</div>
                  </div>
                  <div className="text-text-secondary text-sm leading-relaxed">
                    AI model identifies the {(selectedSegment.targeting_rate * 100).toFixed(0)}% of this segment most likely to respond to retention efforts, avoiding wasted spend on low-probability customers.
                  </div>
                </div>
                <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp size={20} className="text-text-primary" />
                    <div className="text-text-primary font-semibold">ROI Projection</div>
                  </div>
                  <div className="text-text-secondary text-sm leading-relaxed">
                    Expected {selectedSegment.expected_roi > 0 ? selectedSegment.expected_roi.toFixed(1) : 'N/A'}x return on retention spend through reduced churn and extended customer lifetime value.
                  </div>
                </div>
                <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Users size={20} className="text-text-primary" />
                    <div className="text-text-primary font-semibold">Deployment Timeline</div>
                  </div>
                  <div className="text-text-secondary text-sm leading-relaxed">
                    {selectedSegment.implementation_timeline} to full campaign deployment with phased rollout and performance monitoring.
                  </div>
                </div>
              </div>
            </div>

            {/* Close button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-8 py-3 rounded-lg font-semibold text-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: 'var(--color-accent-primary)',
                  color: '#FFFFFF',
                }}
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

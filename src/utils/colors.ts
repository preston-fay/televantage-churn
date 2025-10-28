// Brand-approved Kearney gray–purple scale for risk visualization
export const riskColors = {
  veryHigh: "#7823DC",  // core purple (unchanged)
  high: "#C8A5F0",      // lavender for "High" risk
  medium: "#A5A5A5",    // medium gray
  low: "#D2D2D2"        // light gray
};

// Apply consistently to all risk-based charts
export const getRiskColor = (risk: string): string => {
  const normalized = risk.toLowerCase().replace(/\s+/g, '');

  switch (normalized) {
    case 'veryhigh':
      return riskColors.veryHigh;
    case 'high':
      return riskColors.high;
    case 'medium':
      return riskColors.medium;
    case 'low':
      return riskColors.low;
    default:
      return riskColors.low; // default fallback
  }
};

// Legacy mapping for components expecting object keys with spaces
export const riskColorMap: Record<string, string> = {
  'Very High': riskColors.veryHigh,
  'High': riskColors.high,
  'Medium': riskColors.medium,
  'Low': riskColors.low
};

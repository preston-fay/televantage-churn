import type {
  Model,
  Segment,
  Metrics,
  CustomersSummary,
  RiskDistribution,
  FeatureImportance,
  AppData,
} from '@/types';

export async function loadModels(): Promise<Model[]> {
  const response = await fetch('/src/data/models.json');
  const data = await response.json();
  return data.models;
}

export async function loadSegments(): Promise<Segment[]> {
  const response = await fetch('/src/data/segments.json');
  const data = await response.json();
  return data.segments;
}

export async function loadMetrics(): Promise<Metrics> {
  const response = await fetch('/src/data/metrics.json');
  return response.json();
}

export async function loadCustomersSummary(): Promise<CustomersSummary> {
  const response = await fetch('/src/data/customers_summary.json');
  return response.json();
}

export async function loadRiskDistribution(): Promise<RiskDistribution> {
  const response = await fetch('/src/data/risk_distribution.json');
  return response.json();
}

export async function loadFeatureImportance(): Promise<FeatureImportance> {
  const response = await fetch('/src/data/feature_importance.json');
  return response.json();
}

export async function loadAllData(): Promise<AppData> {
  const [
    models,
    segments,
    metrics,
    customers_summary,
    risk_distribution,
    feature_importance,
  ] = await Promise.all([
    loadModels(),
    loadSegments(),
    loadMetrics(),
    loadCustomersSummary(),
    loadRiskDistribution(),
    loadFeatureImportance(),
  ]);

  return {
    models,
    segments,
    metrics,
    customers_summary,
    risk_distribution,
    feature_importance,
  };
}

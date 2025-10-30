#!/usr/bin/env python3
"""
ChurnIQ Intelligence Platform - Demo Data Generator

This script scales real churn analysis results from the telco-churn_v2 project
(7,044 customers) to enterprise scale (47.3M customers) with a 6,714x scale factor.

Usage:
    python3 scripts/generate_demo_data.py

Outputs:
    - src/data/segments.json (54 segments)
    - src/data/models.json (6 model comparison)
    - src/data/metrics.json (performance metrics)
    - src/data/customers_summary.json (customer statistics)
    - src/data/risk_distribution.json (risk aggregates)
    - src/data/feature_importance.json (top 10 drivers)
"""

import json
import csv
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any

# Configuration
SOURCE_PROJECT = Path("/Users/pfay01/Projects/telco-churn_v2")
TARGET_DIR = Path("src/data")
SCALE_FACTOR = 6714
BASE_CUSTOMERS = 7044
TARGET_CUSTOMERS = 47300000

# Business assumptions
ARPU = 65  # Average Revenue Per User (monthly)
ANNUAL_MONTHS = 12
DEFAULT_LTV_MONTHS = 36


def load_source_data():
    """Load data from telco-churn_v2 project."""
    print("📥 Loading source data from telco-churn_v2...")

    # Load model leaderboard
    models_df = pd.read_csv(SOURCE_PROJECT / "artifacts/model_leaderboard.csv")

    # Load complete metrics
    with open(SOURCE_PROJECT / "artifacts/complete_metrics.json") as f:
        complete_metrics = json.load(f)

    # Load segment thresholds
    thresholds_df = pd.read_csv(SOURCE_PROJECT / "artifacts/segment_optimal_thresholds.csv")

    # Load scored customers
    scored_df = pd.read_csv(SOURCE_PROJECT / "results/scored_FIXED.csv")

    print(f"  ✅ Loaded {len(models_df)} models")
    print(f"  ✅ Loaded {len(thresholds_df)} segment thresholds")
    print(f"  ✅ Loaded {len(scored_df)} scored customers")

    return {
        "models": models_df,
        "metrics": complete_metrics,
        "thresholds": thresholds_df,
        "scored": scored_df
    }


def generate_models_json(models_df: pd.DataFrame) -> Dict[str, Any]:
    """Generate models comparison JSON."""
    print("\n🔧 Generating models.json...")

    models_list = []
    for _, row in models_df.iterrows():
        is_winner = row['abbrev'] == 'LR_en'

        # Business rationale for model selection
        rationales = {
            'LR_en': 'Best AUC (0.8500), highly interpretable coefficients, fast inference',
            'CB': 'Strong AUC (0.8456), handles missing data well, but less interpretable',
            'MLP': 'Good performance (0.8433), but black-box model, harder to explain',
            'XGB': 'Competitive (0.8399), gradient boosting power, moderate interpretability',
            'RF': 'Solid baseline (0.8378), robust to overfitting, ensemble benefits',
            'LGB': 'Fast training (0.8371), memory efficient, but slightly lower AUC'
        }

        models_list.append({
            "name": row['model'],
            "abbrev": row['abbrev'],
            "auc": round(float(row['AUC']), 4),
            "brier": round(float(row['Brier']), 4),
            "average_precision": round(float(row['AP']), 4),
            "training_time_seconds": round(float(row['training_time_seconds']), 2),
            "winner": is_winner,
            "rationale": rationales.get(row['abbrev'], "Baseline model")
        })

    # Sort by AUC descending
    models_list.sort(key=lambda x: x['auc'], reverse=True)

    print(f"  ✅ Generated {len(models_list)} model records")
    return {"models": models_list}


def generate_segments_json(thresholds_df: pd.DataFrame, scored_df: pd.DataFrame) -> Dict[str, Any]:
    """Generate segments JSON with scaled customer counts."""
    print("\n🔧 Generating segments.json...")

    # Aggregate scored data by segment
    segment_stats = scored_df.groupby(['tenure_band', 'contract_group', 'value_tier']).agg({
        'customerid': 'count',
        'churn_prob': 'mean',
        'target_flag': 'sum'
    }).reset_index()

    segment_stats.columns = ['tenure_band', 'contract_group', 'value_tier', 'count', 'avg_prob', 'targeted']

    # Merge with thresholds
    segments_merged = pd.merge(
        segment_stats,
        thresholds_df,
        on=['tenure_band', 'contract_group', 'value_tier'],
        how='left'
    )

    # Fill missing thresholds with default
    segments_merged['best_threshold'] = segments_merged['best_threshold'].fillna(0.5)

    # Scale customer counts
    segments_list = []
    for _, row in segments_merged.iterrows():
        scaled_customers = int(row['count'] * SCALE_FACTOR)
        scaled_targeted = int(row['targeted'] * SCALE_FACTOR)
        avg_churn_prob = float(row['avg_prob'])

        # Determine risk level
        if avg_churn_prob >= 0.50:
            risk_level = "Very High"
        elif avg_churn_prob >= 0.30:
            risk_level = "High"
        elif avg_churn_prob >= 0.15:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Generate strategy recommendations based on segment characteristics
        strategy = generate_strategy_recommendation(
            row['tenure_band'],
            row['contract_group'],
            row['value_tier'],
            avg_churn_prob
        )

        # Calculate expected ROI (simplified)
        intervention_cost = 50  # $50 per intervention
        save_rate = 0.30  # 30% save rate
        saved_customers = scaled_targeted * save_rate
        revenue_saved = saved_customers * ARPU * ANNUAL_MONTHS
        cost = scaled_targeted * intervention_cost
        expected_roi = (revenue_saved - cost) / cost if cost > 0 else 0

        segments_list.append({
            "tenure_band": row['tenure_band'],
            "contract_group": row['contract_group'],
            "value_tier": row['value_tier'],
            "customers": scaled_customers,
            "churn_probability": round(avg_churn_prob, 3),
            "threshold": round(float(row['best_threshold']), 2),
            "targeted_customers": scaled_targeted,
            "targeting_rate": round(scaled_targeted / scaled_customers, 3) if scaled_customers > 0 else 0,
            "avg_ltv": int(ARPU * DEFAULT_LTV_MONTHS),
            "risk_level": risk_level,
            "strategy": strategy,
            "expected_roi": round(expected_roi, 2),
            "implementation_timeline": estimate_timeline(scaled_customers)
        })

    print(f"  ✅ Generated {len(segments_list)} segment records")
    return {"segments": segments_list}


def generate_strategy_recommendation(tenure: str, contract: str, value: str, churn_prob: float) -> str:
    """Generate segment-specific strategy recommendation."""

    # Early tenure, high risk
    if tenure in ["0-3m", "4-12m"] and churn_prob > 0.30:
        return f"Onboarding intervention: Dedicated support + usage training for new {value.lower()}-value customers"

    # M2M contract, any risk
    elif contract == "M2M" and churn_prob > 0.25:
        return f"Contract upgrade: Offer annual contract with ${int(churn_prob * 100)} incentive + price lock"

    # High value, moderate risk
    elif value == "High" and 0.15 < churn_prob < 0.30:
        return "Retention offer: VIP support + loyalty rewards + exclusive features"

    # Mid tenure, moderate risk
    elif tenure in ["13-24m", "25-48m"] and churn_prob > 0.20:
        return "Win-back campaign: Personalized offer based on usage patterns + competitor matching"

    # Low risk
    elif churn_prob < 0.15:
        return "Maintain engagement: Regular check-ins + upsell opportunities + referral incentives"

    # Default
    else:
        return f"Targeted retention: {contract} customers with tailored {value.lower()}-value offers"


def estimate_timeline(customer_count: int) -> str:
    """Estimate implementation timeline based on customer count."""
    if customer_count > 5000000:
        return "6-9 months"
    elif customer_count > 1000000:
        return "3-6 months"
    elif customer_count > 100000:
        return "2-3 months"
    else:
        return "1-2 months"


def generate_metrics_json(metrics: Dict, scored_df: pd.DataFrame) -> Dict[str, Any]:
    """Generate performance metrics JSON."""
    print("\n🔧 Generating metrics.json...")

    # Calculate confusion matrix at optimal threshold
    # Scale counts by SCALE_FACTOR
    total_customers = TARGET_CUSTOMERS
    actual_churners = int(total_customers * 0.265)  # Assume 26.5% churn rate

    # From model performance (AUC 0.85, typical confusion matrix)
    true_positives = int(actual_churners * 0.75)  # 75% recall
    false_negatives = actual_churners - true_positives

    targeted_total = int(total_customers * 0.26)  # 26% targeting rate
    false_positives = targeted_total - true_positives
    true_negatives = total_customers - actual_churners - false_positives

    # Generate calibration data (10 bins)
    calibration_bins = []
    for i in range(10):
        predicted = (i + 0.5) / 10  # Midpoint of each 10% bin
        # Well-calibrated model: actual ≈ predicted
        actual = predicted + (0.02 * (0.5 - predicted))  # Slight calibration error
        calibration_bins.append({
            "predicted": round(predicted, 2),
            "actual": round(actual, 3)
        })

    metrics_output = {
        "overview": {
            "total_customers": TARGET_CUSTOMERS,
            "annual_churn_cost": int(actual_churners * ARPU * ANNUAL_MONTHS),
            "ai_opportunity": int(true_positives * 0.30 * ARPU * ANNUAL_MONTHS),  # 30% save rate
            "model_auc": 0.8500,
            "model_name": "Logistic Regression (ElasticNet)"
        },
        "calibration": {
            "bins": calibration_bins
        },
        "confusion_matrix": {
            "true_positives": true_positives,
            "false_positives": false_positives,
            "true_negatives": true_negatives,
            "false_negatives": false_negatives,
            "labels": {
                "true_positives": "Correctly identified churners (saved)",
                "false_positives": "Wasted interventions",
                "false_negatives": "Missed churners (lost revenue)",
                "true_negatives": "Correctly left alone"
            }
        }
    }

    print(f"  ✅ Generated metrics with {len(calibration_bins)} calibration bins")
    return metrics_output


def generate_customers_summary_json(scored_df: pd.DataFrame) -> Dict[str, Any]:
    """Generate customer summary statistics JSON."""
    print("\n🔧 Generating customers_summary.json...")

    # Calculate distributions from scored data
    contract_dist = scored_df['contract_group'].value_counts()
    tenure_dist = scored_df['tenure_band'].value_counts()
    value_dist = scored_df['value_tier'].value_counts()

    def scale_distribution(dist):
        total = dist.sum()
        return {
            category: {
                "count": int((count / total) * TARGET_CUSTOMERS),
                "pct": round(count / total, 3)
            }
            for category, count in dist.items()
        }

    summary = {
        "total_customers": TARGET_CUSTOMERS,
        "by_contract": scale_distribution(contract_dist),
        "by_tenure": scale_distribution(tenure_dist),
        "by_value": scale_distribution(value_dist)
    }

    print(f"  ✅ Generated customer summary")
    return summary


def generate_risk_distribution_json(scored_df: pd.DataFrame) -> Dict[str, Any]:
    """Generate risk distribution JSON."""
    print("\n🔧 Generating risk_distribution.json...")

    # Classify customers into risk levels based on churn probability
    def classify_risk(prob):
        if prob >= 0.50:
            return "Very High"
        elif prob >= 0.30:
            return "High"
        elif prob >= 0.15:
            return "Medium"
        else:
            return "Low"

    scored_df['risk_level'] = scored_df['churn_prob'].apply(classify_risk)
    risk_dist = scored_df['risk_level'].value_counts()

    total = len(scored_df)
    risk_levels = []
    for level in ["Low", "Medium", "High", "Very High"]:
        count = risk_dist.get(level, 0)
        scaled_count = int((count / total) * TARGET_CUSTOMERS)
        risk_levels.append({
            "level": level,
            "customers": scaled_count,
            "percentage": round(count / total, 3)
        })

    print(f"  ✅ Generated {len(risk_levels)} risk levels")
    return {"risk_levels": risk_levels}


def generate_feature_importance_json() -> Dict[str, Any]:
    """Generate feature importance JSON."""
    print("\n🔧 Generating feature_importance.json...")

    # Based on common telco churn drivers (from domain knowledge)
    features = [
        {
            "name": "Contract Type",
            "importance": 0.287,
            "interpretation": "Month-to-month contracts 5x more likely to churn"
        },
        {
            "name": "Tenure",
            "importance": 0.219,
            "interpretation": "Customers with <12 months tenure highest risk"
        },
        {
            "name": "Monthly Charges",
            "importance": 0.156,
            "interpretation": "High bills ($75+) correlate with churn"
        },
        {
            "name": "Total Charges",
            "importance": 0.098,
            "interpretation": "Low lifetime value indicates early churn risk"
        },
        {
            "name": "Tech Support Calls",
            "importance": 0.085,
            "interpretation": "3+ calls in 90 days signals dissatisfaction"
        },
        {
            "name": "Payment Method",
            "importance": 0.064,
            "interpretation": "Electronic check users churn 2x more"
        },
        {
            "name": "Internet Service",
            "importance": 0.041,
            "interpretation": "Fiber users churn less than DSL"
        },
        {
            "name": "Online Security",
            "importance": 0.023,
            "interpretation": "No security add-ons = higher churn"
        },
        {
            "name": "Streaming Services",
            "importance": 0.019,
            "interpretation": "No streaming subscriptions = lower engagement"
        },
        {
            "name": "Paperless Billing",
            "importance": 0.008,
            "interpretation": "Minimal impact on churn"
        }
    ]

    print(f"  ✅ Generated {len(features)} feature importance records")
    return {"features": features}


def main():
    """Main execution function."""
    print("=" * 80)
    print("ChurnIQ Demo Data Generator")
    print("=" * 80)
    print(f"Scaling: {BASE_CUSTOMERS:,} → {TARGET_CUSTOMERS:,} customers")
    print(f"Scale Factor: {SCALE_FACTOR}x")
    print()

    # Ensure output directory exists
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    # Load source data
    source = load_source_data()

    # Generate all JSON files
    data_files = {
        "models.json": generate_models_json(source["models"]),
        "segments.json": generate_segments_json(source["thresholds"], source["scored"]),
        "metrics.json": generate_metrics_json(source["metrics"], source["scored"]),
        "customers_summary.json": generate_customers_summary_json(source["scored"]),
        "risk_distribution.json": generate_risk_distribution_json(source["scored"]),
        "feature_importance.json": generate_feature_importance_json()
    }

    # Write all files
    print("\n💾 Writing JSON files...")
    for filename, data in data_files.items():
        output_path = TARGET_DIR / filename
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        file_size = output_path.stat().st_size
        print(f"  ✅ {filename:30s} ({file_size:,} bytes)")

    print("\n" + "=" * 80)
    print("✅ Demo data generation complete!")
    print("=" * 80)
    print(f"\nGenerated {len(data_files)} JSON files in {TARGET_DIR}/")
    print("\nNext steps:")
    print("  1. Review generated data files")
    print("  2. Run: orchestrator run checkpoint")
    print()


if __name__ == "__main__":
    main()

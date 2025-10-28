/**
 * Copilot Planner Schema
 *
 * Defines the structure that the LLM must return - a plan describing
 * what data to fetch, how to process it, and how to visualize it.
 * The executor will run this plan against real app data.
 */

import { z } from "zod";

/**
 * Request context passed to the planner
 */
export const PlannerRequest = z.object({
  question: z.string(),
  context: z.object({
    risk_distribution: z.any().optional(),
    feature_importance: z.any().optional(),
    roi_by_strategy: z.any().optional(),
    financials: z.any().optional(),
    segments: z.any().optional(),
    glossary: z.array(z.object({ term: z.string(), def: z.string() })).optional(),
  })
});

/**
 * Data operation to execute
 */
export const DataOperation = z.object({
  op: z.enum(["topN", "group", "aggregate", "compare", "slice", "filter"]),
  from: z.string(),                                    // dataset key (e.g., "feature_importance")
  select: z.array(z.string()).optional(),              // fields to project
  where: z.array(z.object({
    field: z.string(),
    op: z.string(),                                    // eq, gt, lt, in, contains
    value: z.any()
  })).optional(),
  orderBy: z.object({
    field: z.string(),
    dir: z.enum(["asc", "desc"])
  }).optional(),
  limit: z.number().optional(),
  groupBy: z.string().optional(),                      // for aggregations
  aggregateFn: z.enum(["sum", "avg", "count", "max", "min"]).optional()
});

/**
 * Complete execution plan returned by LLM
 */
export const Plan = z.object({
  intent: z.enum([
    "drivers",
    "risk",
    "roi_compare",
    "segment_deepdive",
    "financial_kpis",
    "generic"
  ]),
  metrics: z.array(z.string()).min(1),                 // datasets needed
  operations: z.array(DataOperation).min(1),           // processing steps
  chart: z.object({
    kind: z.enum(["bar", "donut", "line", "horizontal-bar"]),
    title: z.string().min(3),
    xLabel: z.string().optional(),
    yLabel: z.string().optional()
  }),
  narrativeFocus: z.array(z.string()).min(1),          // key points for narrative
  citations: z.array(z.string()).min(1)                // source references
});

export type PlannerRequest = z.infer<typeof PlannerRequest>;
export type DataOperation = z.infer<typeof DataOperation>;
export type Plan = z.infer<typeof Plan>;

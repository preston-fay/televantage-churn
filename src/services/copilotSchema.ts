/**
 * Strict TypeScript/Zod schema for Strategy Copilot responses
 *
 * Ensures all GPT-5 responses are validated and properly structured.
 */

import { z } from "zod";

/**
 * Chart data point - x can be string (category) or number (time series)
 */
export const ChartPoint = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.number()
});

/**
 * Named series of data points for multi-series charts
 */
export const ChartSeries = z.object({
  name: z.string().min(1, "Series name cannot be empty"),
  data: z.array(ChartPoint).min(1, "Series must have at least one data point")
});

/**
 * Complete chart specification with labels and data
 * ALWAYS include title and appropriate labels for axes
 */
export const ChartSpec = z.object({
  kind: z.enum(["bar", "donut", "line", "horizontal-bar"]),
  title: z.string().min(3, "Chart title must be descriptive"),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  series: z.array(ChartSeries).min(1, "Chart must have at least one series"),
  notes: z.string().optional()
});

/**
 * Citation referencing a specific tab/chart in the application
 */
export const Citation = z.object({
  source: z.enum([
    "ExecutiveDashboard",
    "ScenarioPlanner",
    "SegmentExplorer",
    "AIPoweredIntelligence",
    "ModelingDeepDive"
  ]),
  ref: z.string().min(1, "Citation reference cannot be empty")
});

/**
 * Complete copilot response with REQUIRED text and citations
 * Chart is optional and should only be included if it adds genuine value
 */
export const CopilotResponse = z.object({
  text: z.string().min(20, "Response text must be at least 20 characters"),
  citations: z.array(Citation).min(1, "Must provide at least one citation"),
  chart: ChartSpec.optional(),
  relatedSegments: z.array(z.string()).optional(),
  followUps: z.array(z.string()).min(2, "Must provide at least 2 follow-up suggestions").max(5, "Maximum 5 follow-up suggestions")
});

// Export TypeScript types
export type ChartPoint = z.infer<typeof ChartPoint>;
export type ChartSeries = z.infer<typeof ChartSeries>;
export type ChartSpec = z.infer<typeof ChartSpec>;
export type Citation = z.infer<typeof Citation>;
export type CopilotResponse = z.infer<typeof CopilotResponse>;

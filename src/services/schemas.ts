/**
 * Strict Zod Schemas for Strategy Copilot v2
 * Enforces type safety and validation for plans, charts, and responses
 */

import { z } from "zod";

export const Plan = z.object({
  intent: z.enum([
    "arpu",
    "cltv",
    "irr",
    "roi_compare",
    "risk_dist",
    "drivers",
    "segment_deepdive",
    "financial_kpis",
    "generic"
  ]),
  operations: z.array(z.object({
    op: z.enum(["topN", "aggregate", "compute", "slice", "compare"]),
    from: z.string().optional(),
    select: z.array(z.string()).optional(),
    where: z.array(z.object({
      field: z.string(),
      op: z.string(),
      value: z.any()
    })).optional(),
    orderBy: z.object({
      field: z.string(),
      dir: z.enum(["asc", "desc"])
    }).optional(),
    limit: z.number().optional(),
    compute: z.object({
      kind: z.enum(["arpuImpact", "cltv", "irr", "roi"]),
      params: z.any()
    }).optional()
  })).min(1),
  chart: z.object({
    kind: z.enum(["bar", "donut", "line", "horizontal-bar"]),
    title: z.string().min(3),
    xLabel: z.string().optional(),
    yLabel: z.string().optional()
  }),
  citations: z.array(z.string()).min(1),
  narrativeFocus: z.array(z.string()).min(1)
});

export type Plan = z.infer<typeof Plan>;

export const ChartPoint = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.number()
});

export const ChartSeries = z.object({
  name: z.string(),
  data: z.array(ChartPoint).min(1)
});

export const ChartSpec = z.object({
  kind: z.enum(["bar", "donut", "line", "horizontal-bar"]),
  title: z.string().min(3),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  series: z.array(ChartSeries).min(1)
}).superRefine((val, ctx) => {
  // Enforce axis labels for non-donut charts
  if (val.kind !== "donut") {
    if (!val.xLabel || val.xLabel.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "xLabel required for non-donut charts"
      });
    }
    if (!val.yLabel || val.yLabel.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "yLabel required for non-donut charts"
      });
    }
  }
});

export type ChartSpec = z.infer<typeof ChartSpec>;

export const CopilotResponse = z.object({
  text: z.string().min(20),
  citations: z.array(z.object({
    source: z.string(),
    ref: z.string()
  })).min(1),
  chart: ChartSpec.optional(),
  followUps: z.array(z.string()).min(2).max(5)
});

export type CopilotResponse = z.infer<typeof CopilotResponse>;

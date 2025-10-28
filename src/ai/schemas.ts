import { z } from "zod";

export const ChartPoint = z.object({ x: z.union([z.string(), z.number()]), y: z.number() });
export const ChartSeries = z.object({ name: z.string(), data: z.array(ChartPoint).min(1) });
export const ChartSpec = z.object({
  kind: z.enum(["bar","donut","line"]),
  title: z.string().min(3),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  series: z.array(ChartSeries).min(1)
}).superRefine((v, ctx) => {
  if (v.kind !== "donut") {
    if (!v.xLabel) ctx.addIssue({ code:"custom", message:"xLabel required for non-donut chart" });
    if (!v.yLabel) ctx.addIssue({ code:"custom", message:"yLabel required for non-donut chart" });
  }
});

export const Answer = z.object({
  text: z.string().min(20),
  citations: z.array(z.object({ source: z.string(), ref: z.string() })).min(1),
  chart: ChartSpec.optional(),
  followUps: z.array(z.string()).min(2).max(5)
});
export type Answer = z.infer<typeof Answer>;

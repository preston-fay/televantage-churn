import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DonutChartData {
  level: string;
  customers: number;
  percentage: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  width?: number;
  height?: number;
  centerLabel?: string;
  centerValue?: string;
}

export default function DonutChart({
  data,
  width = 400,
  height = 400,
  centerLabel = '',
  centerValue = '',
}: DonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Add generous padding to prevent label cutoff, especially at bottom
    const padding = 100;
    const radius = Math.min(width - padding * 2, height - padding * 2) / 2;
    const innerRadius = radius * 0.45; // Wider ring to fit labels inside
    const outerRadius = radius * 0.85; // Wider ring to fit labels inside

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create pie layout
    const pie = d3
      .pie<DonutChartData>()
      .value((d) => d.customers)
      .sort(null);

    // Create arc generator
    const arc = d3
      .arc<d3.PieArcDatum<DonutChartData>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const hoverArc = d3
      .arc<d3.PieArcDatum<DonutChartData>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius + 10);

    // Create arcs
    const arcs = svg
      .selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Add paths
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#0A0A0A')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease')
      .on('mouseenter', function (event, d) {
        // Expand arc on hover
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', (datum: any) => hoverArc(datum) || '');

        // Show tooltip
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px;">${d.data.level} Risk</div>
            <div>Customers: ${d.data.customers.toLocaleString()}</div>
            <div>Percentage: ${(d.data.percentage * 100).toFixed(1)}%</div>
          `
          );
      })
      .on('mousemove', function (event) {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseleave', function () {
        // Return to normal size
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', (datum: any) => arc(datum) || '');

        // Hide tooltip
        d3.select(tooltipRef.current).style('opacity', 0);
      });

    // Helper function to determine text color based on background
    const getTextColor = (bgColor: string) => {
      // Light colors (grays) need dark text, dark colors (purples) need light text
      const lightColors = ['#D2D2D2', '#A5A5A5'];
      return lightColors.includes(bgColor) ? '#0A0A0A' : '#FFFFFF';
    };

    // Add percentage labels - positioned at the centroid (inside the ring)
    arcs
      .append('text')
      .attr('transform', (d) => {
        const [x, y] = arc.centroid(d);
        return `translate(${x}, ${y - 8})`;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => getTextColor(d.data.color))
      .attr('font-size', '16px')
      .attr('font-weight', '700')
      .attr('font-family', 'Inter, sans-serif')
      .style('pointer-events', 'none')
      .text((d) => `${(d.data.percentage * 100).toFixed(0)}%`);

    // Add level labels - also at centroid, below percentage
    arcs
      .append('text')
      .attr('transform', (d) => {
        const [x, y] = arc.centroid(d);
        return `translate(${x}, ${y + 8})`;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => getTextColor(d.data.color))
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .attr('font-family', 'Inter, sans-serif')
      .style('pointer-events', 'none')
      .text((d) => d.data.level);

    // Add center label
    if (centerLabel) {
      svg
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -10)
        .attr('fill', '#A5A5A5')
        .attr('font-size', '14px')
        .attr('font-family', 'Inter, sans-serif')
        .text(centerLabel);
    }

    // Add center value
    if (centerValue) {
      svg
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 15)
        .attr('fill', '#FFFFFF')
        .attr('font-size', '24px')
        .attr('font-weight', '600')
        .attr('font-family', 'Inter, sans-serif')
        .text(centerValue);
    }
  }, [data, width, height, centerLabel, centerValue]);

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef}></svg>
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          opacity: 0,
          pointerEvents: 'none',
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '14px',
          color: '#E5E5E5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
      ></div>
    </div>
  );
}

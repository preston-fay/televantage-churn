# ChurnIQ Design System Quick Reference

**Theme:** Kearney Dark Theme
**Target:** Executive presentations (C-suite)
**Tone:** Professional, serious, data-driven

---

## Colors

### Background
```css
--bg-primary: #0A0A0A    /* Pure black - main background */
--bg-secondary: #1A1A1A  /* Slightly lighter - cards, panels */
--bg-tertiary: #2A2A2A   /* Subtle elevation - hover states */
```

### Text
```css
--text-primary: #FFFFFF    /* White - headings, labels */
--text-secondary: #E5E5E5  /* Light gray - body text */
--text-tertiary: #A0A0A0   /* Medium gray - captions, metadata */
```

### Accent
```css
--accent-primary: #7823DC   /* Kearney purple - use SPARINGLY */
--accent-hover: #8B3EED     /* Lighter purple - hover states */
--accent-pressed: #6419C0   /* Darker purple - pressed states */
```

**CRITICAL:** Purple is for ACCENTS ONLY (buttons, highlights, CTAs)
**DO NOT use purple for body text** - readability issue on black background

### Data Visualization (Kearney-Compliant)
```css
/* Chart colors (in order - use sequentially for multi-series) */
--chart-1: #D2D2D2  /* Light gray */
--chart-2: #A5A5A5  /* Medium gray */
--chart-3: #787878  /* Dark gray */
--chart-4: #E6D2FA  /* Light lavender */
--chart-5: #C8A5F0  /* Medium lavender */
--chart-6: #AF7DEB  /* Lavender */
--chart-7: #9150E1  /* Bright purple */
--chart-8: #7823DC  /* Kearney purple - PRIMARY */

/* Risk levels - using purple gradient (NO red/green/amber) */
--risk-low: #E6D2FA       /* Light lavender - low risk */
--risk-medium: #C8A5F0    /* Medium lavender - medium risk */
--risk-high: #9150E1      /* Bright purple - high risk */
--risk-very-high: #7823DC /* Kearney purple - very high risk */

/* Accent/highlight - Kearney purple */
--viz-primary: #7823DC    /* Primary visualization color */
--viz-secondary: #9150E1  /* Secondary visualization color */
--viz-tertiary: #AF7DEB   /* Tertiary visualization color */
```

**IMPORTANT:** All data visualizations must use ONLY Kearney-approved colors (purple gradient + grays). No red, green, blue, cyan, orange, teal, or other non-Kearney colors.

---

## Typography

### Font Family
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Why Inter:**
- Modern UI font designed for screens (not print)
- Better readability at small sizes
- Used by GitHub, Mozilla, Figma (industry standard)
- Free, open source, widely available
- Variable font support for performance

### Font Sizes
```css
--text-xs: 12px    /* Captions, metadata */
--text-sm: 14px    /* Secondary text */
--text-base: 16px  /* Body text */
--text-lg: 18px    /* Subheadings */
--text-xl: 20px    /* Headings */
--text-2xl: 24px   /* Section titles */
--text-3xl: 30px   /* Hero metrics */
--text-4xl: 36px   /* Page titles */
```

### Font Weights
```css
--font-normal: 400   /* Body text */
--font-medium: 500   /* Subheadings */
--font-semibold: 600 /* Headings */
--font-bold: 700     /* Emphasis, KPIs */
```

---

## Spacing

### Scale
```css
--spacing-1: 4px
--spacing-2: 8px
--spacing-3: 12px
--spacing-4: 16px
--spacing-5: 20px
--spacing-6: 24px
--spacing-8: 32px
--spacing-10: 40px
--spacing-12: 48px
--spacing-16: 64px
--spacing-20: 80px
```

### Common Patterns
- **Card padding:** 24px (spacing-6)
- **Section padding:** 48px (spacing-12)
- **Element gap:** 16px (spacing-4)
- **Tab padding:** 32px (spacing-8)

---

## Components

### KPI Card
```
Background: #1A1A1A (bg-secondary)
Border: 1px solid #2A2A2A
Padding: 24px
Border-radius: 8px

Label: 14px, #A0A0A0 (text-tertiary)
Value: 36px, #FFFFFF, bold
Change: 16px, #10B981 (positive) or #EF4444 (negative)
```

### Button (Primary)
```
Background: #7823DC (accent-primary)
Text: #FFFFFF, 16px, font-medium
Padding: 12px 24px
Border-radius: 6px
Hover: #8B3EED (accent-hover)
Pressed: #6419C0 (accent-pressed)
```

### Button (Secondary)
```
Background: transparent
Border: 1px solid #7823DC
Text: #7823DC, 16px, font-medium
Padding: 12px 24px
Border-radius: 6px
Hover: Background #7823DC, Text #FFFFFF
```

### Input/Slider
```
Track: #2A2A2A (bg-tertiary)
Thumb: #7823DC (accent-primary)
Label: 14px, #E5E5E5 (text-secondary)
Value: 16px, #FFFFFF, font-medium
```

### Modal
```
Background: #1A1A1A (bg-secondary)
Border: 1px solid #2A2A2A
Border-radius: 12px
Padding: 32px
Max-width: 600px
Box-shadow: 0 20px 60px rgba(0,0,0,0.5)

Header: 24px, #FFFFFF, font-semibold
Body: 16px, #E5E5E5
Close button: #A0A0A0, hover #FFFFFF
```

---

## Charts (D3.js)

### General Rules
- **NO gridlines** (cleaner, more executive-friendly)
- **Clean axes** (thin lines, subtle labels)
- **Label-first** (chart titles, axis labels prominent)
- **High contrast** (white text on black background)
- **Hover tooltips** (provide context, not clutter)

### Axis Styling
```javascript
// X-axis
axis.select('.domain').attr('stroke', '#2A2A2A');
axis.selectAll('.tick line').attr('stroke', '#2A2A2A');
axis.selectAll('.tick text')
  .attr('fill', '#A0A0A0')
  .attr('font-size', '12px')
  .attr('font-family', 'Inter, sans-serif');

// Y-axis (same)
// NO gridlines: .selectAll('.tick line').remove()
```

### Chart Colors (Kearney-Compliant)
```javascript
// Kearney-approved chart colors (use in order for multi-series)
const chartColors = [
  '#D2D2D2', // Light gray
  '#A5A5A5', // Medium gray
  '#787878', // Dark gray
  '#E6D2FA', // Light lavender
  '#C8A5F0', // Medium lavender
  '#AF7DEB', // Lavender
  '#9150E1', // Bright purple
  '#7823DC', // Kearney purple (PRIMARY)
];

// Risk levels - purple gradient (NO red/green/amber)
const riskColors = {
  'Low': '#E6D2FA',       // Light lavender
  'Medium': '#C8A5F0',    // Medium lavender
  'High': '#9150E1',      // Bright purple
  'Very High': '#7823DC'  // Kearney purple
};

// Primary accent/highlight
const highlightColor = '#7823DC'; // Kearney purple

// Grayscale for neutral data (Kearney-approved grays)
const neutralColors = ['#D2D2D2', '#A5A5A5', '#787878'];
```

**COLOR COMPLIANCE:**
- ✅ Use only Kearney-approved colors from the official palette
- ✅ Purple gradient for risk levels (light lavender → dark purple)
- ✅ Grays for categorical data
- ✅ **Kearney purple (#7823DC) as "insight" color** - use to highlight stand-out insights, key data points, or important bars in charts
- ❌ NO red, green, blue, cyan, orange, teal, or other non-Kearney colors

**INSIGHT HIGHLIGHTING:**
Use Kearney purple (#7823DC) strategically to draw executive attention:
- Single bar in a chart that represents the key takeaway
- Data point that tells the most important story
- Metric that requires action or decision
- Keep other data in grays/lavenders to provide context without distraction

### Tooltip Styling
```css
.tooltip {
  position: absolute;
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  color: #E5E5E5;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.tooltip strong {
  color: #FFFFFF;
  font-weight: 600;
}
```

---

## Dos and Don'ts

### ✅ DO
- Use white (#FFFFFF) for headings
- Use light gray (#E5E5E5) for body text
- Use Kearney purple (#7823DC) for buttons and highlights
- Use semantic colors (green/amber/red) for risk levels
- Use Inter font (modern, highly readable)
- Keep charts clean (no gridlines)
- Label everything clearly
- Provide context in tooltips
- Use high contrast for accessibility

### ❌ DON'T
- Use purple for body text (readability issue)
- Add gridlines to charts (cluttered)
- Use emojis in UI (unprofessional)
- Use outdated fonts like Arial (Inter is superior)
- Use low-contrast colors (accessibility issue)
- Overuse animations (distraction)
- Use pie charts (hard to compare)
- Use tiny text (<12px)

---

## Accessibility

### Contrast Ratios (WCAG AA)
- **White on black:** 21:1 (excellent)
- **Light gray on black:** 12:1 (excellent)
- **Purple on black:** 4.6:1 (acceptable for large text only)

### Keyboard Navigation
- Tab order follows visual flow
- Focus indicators visible (purple outline)
- Escape key closes modals
- Arrow keys navigate sliders

### Screen Readers
- All charts have aria-labels
- KPI cards have semantic structure
- Modals have focus trap
- Interactive elements have roles

---

## Example Usage

### Hero KPI Card
```tsx
<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
  <div className="text-sm text-[#A0A0A0] mb-2">Customer Base</div>
  <div className="text-4xl font-bold text-white">47.3M</div>
  <div className="text-base text-[#10B981] mt-2">+2.1% YoY</div>
</div>
```

### Primary Button
```tsx
<button className="bg-[#7823DC] hover:bg-[#8B3EED] active:bg-[#6419C0]
                   text-white font-medium px-6 py-3 rounded-md
                   transition-colors duration-200">
  Run Scenario
</button>
```

### Chart Title
```tsx
<h3 className="text-xl font-semibold text-white mb-4">
  Churn Economics Waterfall
</h3>
```

---

**This design system ensures:**
- Professional, C-suite appropriate aesthetic
- High contrast for readability
- Consistent brand identity
- Accessible to all users
- Print-friendly for reports

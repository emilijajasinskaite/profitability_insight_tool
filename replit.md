# Acron Battery Profitability Calculator

## Overview
A profitability calculator for battery systems with flexibility market integration, solar energy utilization, peak shaving, and spot arbitrage. Built for Acron Energy System to help internal sellers and potential customers evaluate battery investments.

## Current State
- **Status**: MVP Complete
- **Last Updated**: February 2026

## Project Architecture

### Frontend (client/)
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with Acron brand colors (lime green #D4FF00, dark charcoal)
- **UI Components**: Shadcn/ui
- **Key Page**: `/` - Calculator page

### Key Features
1. **Battery Configuration**: Power (kW) and capacity (kWh) sliders
2. **Solar Integration**: Optional solar panel configuration with user-provided spot price
3. **Estimates Toggle**: Users can include/exclude peak shaving and spot-arbitrage (clearly marked as estimates)
4. **Investment Calculator**: ROI and payback period
5. **PDF Export**: Downloadable report with all calculation details and data source labeling

### Data Classification

**VERIFIED Data (from actual Acron operations at Kristiansand Teknologipark):**
- Reference battery: 230 kW
- Availability income: 135,000 kr/year
- Activation income (40 activations): 69,000 kr/year
- Total flex income: 205,000 kr/year
- Per-kW flex income: ~891 kr/kW/year
- Source: Faktiske, fakturerte tall fra Acron-driftet anlegg

**USER-PROVIDED Values (all editable in UI):**
- Solar production (kWh/kWp/year) - default 895 from project example
- Self-consumption without battery (%) - default 30% from project example
- Self-consumption with battery (%) - default 43% from project example
- Spot price (kr/kWh) - default 1.10
- Investment amount

**ESTIMATES (can be toggled off):**
- Peak shaving factor: 42.4 kr/kW/year
- Spot arbitrage: 23.7 kr/kWh/year

**Fixed Fees:**
- Acron vederlag: 15% of total value

### Important Limitations (displayed in UI and PDF)
1. Flex income is VERIFIED and scaled linearly from reference project
2. Peak shaving and spot-arbitrage are ESTIMATES (clearly labeled, can be disabled)
3. Solar values are USER-PROVIDED (solar production, self-consumption, spot price) with example defaults
4. Investment costs exclude foundation and special adaptations

## File Structure
```
client/src/
├── pages/
│   └── calculator.tsx    # Main calculator page with PDF generation
├── components/ui/        # Shadcn components
├── index.css            # Acron theme colors
└── App.tsx              # Router configuration
```

## User Preferences
- Norwegian language (nb-NO)
- Acron brand colors: Lime green (#D4FF00), dark charcoal
- Clean, modern design matching Acron Energy System
- Transparent about data sources with clear "Verifisert" vs "Estimat" labeling

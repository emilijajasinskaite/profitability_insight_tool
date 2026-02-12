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
2. **Flexibility Pricing**: User-configurable activation price, availability price winter, hours/day, activations per winter, summer factor slider
3. **Solar Integration**: Optional solar panel configuration with user-provided spot price
4. **Estimates Toggle**: Users can include/exclude peak shaving and spot-arbitrage (clearly marked as estimates)
5. **Investment Calculator**: ROI and payback period
6. **PDF Export**: Downloadable report with detailed flex breakdown (winter, summer, activation) and data source labeling

### Calculation Model (from Excel)

**Flexibility Market Calculation:**
- Battery effect in MW (kW / 1000)
- Price per hour = availability price winter (kr/MW/t) x battery MW
- Price per day = price per hour x hours/day
- Price per week = price per day x 5 (business days)
- Price per month = price per week x 4
- Price per winter = price per month x 6 (months)
- Price per summer = price per winter x summer factor (default 50%)
- Availability per year = winter + summer
- Activation sum = activation price (kr/MW) x battery MW x activations per winter
- Total flex income = availability per year + activation sum

**Default Values:**
- Activation price: 10,000 kr/MW
- Availability price winter: 200 kr/MW/t
- Hours/day: 2
- Activations per winter: 7
- Summer factor: 50% of winter

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
1. Flex income is calculated from user-configurable prices and battery effect
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
- Transparent about data sources with clear "Estimat" labeling

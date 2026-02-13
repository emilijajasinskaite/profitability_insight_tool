import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Battery, 
  Sun, 
  Zap, 
  TrendingUp, 
  Download, 
  Info, 
  Calculator,
  PiggyBank,
  Clock,
  AlertTriangle,
  HelpCircle
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import acronLogo from "@/assets/acron-logo.png";

const FLEX_DEFAULTS = {
  activationPrice: 10000,
  availabilityPriceWinter: 200,
  hoursPerDay: 2,
  activationsPerWinter: 7,
  summerFactor: 50,
};

const SOLAR_REFERENCE = {
  source: "Holskogveien 76 prosjekteksempel",
  kwhPerKwp: 895,
  selfConsumptionWithoutBattery: 30,
  selfConsumptionWithBattery: 43,
  spotPricePerKwh: 1.10,
};

const ESTIMATES = {
  peakShavingPerKw: 42.4,
  spotArbitragePerKwh: 23.7,
};

const ACRON_FEE_PERCENTAGE = 0.15;

interface CalculationResult {
  flexibilityIncome: number;
  solarUtilizationValue: number;
  peakShavingValue: number;
  spotArbitrageValue: number;
  grossValue: number;
  acronFee: number;
  netValue: number;
  paybackYears: number;
  roi: number;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("nb-NO", {
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

function formatPercent(num: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num);
}

export default function CalculatorPage() {
  const [batteryPower, setBatteryPower] = useState(250);
  const [activationPrice, setActivationPrice] = useState(FLEX_DEFAULTS.activationPrice);
  const [availabilityPriceWinter, setAvailabilityPriceWinter] = useState(FLEX_DEFAULTS.availabilityPriceWinter);
  const [hoursPerDay, setHoursPerDay] = useState(FLEX_DEFAULTS.hoursPerDay);
  const [activationsPerWinter, setActivationsPerWinter] = useState(FLEX_DEFAULTS.activationsPerWinter);
  const [summerFactor, setSummerFactor] = useState(FLEX_DEFAULTS.summerFactor);
  const [includeSolar, setIncludeSolar] = useState(true);
  const [solarCapacity, setSolarCapacity] = useState(355);
  const [spotPrice, setSpotPrice] = useState(SOLAR_REFERENCE.spotPricePerKwh);
  const [solarProductionPerKwp, setSolarProductionPerKwp] = useState(SOLAR_REFERENCE.kwhPerKwp);
  const [selfConsumptionWithoutBattery, setSelfConsumptionWithoutBattery] = useState(SOLAR_REFERENCE.selfConsumptionWithoutBattery);
  const [selfConsumptionWithBattery, setSelfConsumptionWithBattery] = useState(SOLAR_REFERENCE.selfConsumptionWithBattery);
  const [investment, setInvestment] = useState(1200000);
  const [includeEstimates, setIncludeEstimates] = useState(true);

  const batteryMW = batteryPower / 1000;

  const flexBreakdown = useMemo(() => {
    const pricePerHour = availabilityPriceWinter * batteryMW;
    const pricePerDay = pricePerHour * hoursPerDay;
    const pricePerWeek = pricePerDay * 5;
    const pricePerMonth = pricePerWeek * 4;
    const pricePerWinter = pricePerMonth * 6;
    const pricePerSummer = pricePerWinter * (summerFactor / 100);
    const availabilityPerYear = pricePerWinter + pricePerSummer;
    const activationSumWinter = activationPrice * batteryMW * activationsPerWinter;
    const totalFlexIncome = availabilityPerYear + activationSumWinter;
    return {
      pricePerHour,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
      pricePerWinter,
      pricePerSummer,
      availabilityPerYear,
      activationSumWinter,
      totalFlexIncome,
    };
  }, [batteryMW, activationPrice, availabilityPriceWinter, hoursPerDay, activationsPerWinter, summerFactor]);

  const results = useMemo<CalculationResult>(() => {
    const flexibilityIncome = flexBreakdown.totalFlexIncome;
    
    let solarUtilizationValue = 0;
    if (includeSolar && solarCapacity > 0) {
      const annualProduction = solarCapacity * solarProductionPerKwp;
      const additionalSelfConsumption = annualProduction * 
        ((selfConsumptionWithBattery - selfConsumptionWithoutBattery) / 100);
      solarUtilizationValue = additionalSelfConsumption * spotPrice;
    }
    
    let peakShavingValue = 0;
    let spotArbitrageValue = 0;
    
    if (includeEstimates) {
      peakShavingValue = batteryPower * ESTIMATES.peakShavingPerKw;
      spotArbitrageValue = batteryPower * ESTIMATES.spotArbitragePerKwh;
    }
    
    const grossValue = flexibilityIncome + solarUtilizationValue + peakShavingValue + spotArbitrageValue;
    const acronFee = grossValue * ACRON_FEE_PERCENTAGE;
    const netValue = grossValue - acronFee;
    
    const paybackYears = investment > 0 && netValue > 0 ? investment / netValue : 0;
    const roi = investment > 0 ? netValue / investment : 0;
    
    return {
      flexibilityIncome,
      solarUtilizationValue,
      peakShavingValue,
      spotArbitrageValue,
      grossValue,
      acronFee,
      netValue,
      paybackYears,
      roi,
    };
  }, [batteryPower, includeSolar, solarCapacity, spotPrice, solarProductionPerKwp, selfConsumptionWithoutBattery, selfConsumptionWithBattery, investment, includeEstimates, flexBreakdown]);

  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(34, 36, 33);
    doc.rect(0, 0, pageWidth, 45, "F");
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = acronLogo;
      });
      
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.filter = "invert(1)";
      ctx.drawImage(img, 0, 0);
      const invertedLogo = canvas.toDataURL("image/png");
      
      const logoHeight = 10;
      const aspectRatio = img.width / img.height;
      const logoWidth = logoHeight * aspectRatio;
      doc.addImage(invertedLogo, "PNG", 20, 17, logoWidth, logoHeight);
    } catch {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("ACRON", 20, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Energy System", 55, 25);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Lønnsomhetsanalyse - Batterisystem", 20, 38);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generert: ${new Date().toLocaleDateString("nb-NO")}`, pageWidth - 50, 55);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Systemkonfigurasjon", 20, 65);
    
    autoTable(doc, {
      startY: 70,
      head: [["Parameter", "Verdi"]],
      body: [
        ["Batterieffekt", `${formatNumber(batteryPower)} kWh (${batteryMW} MWh)`],
        ["Aktiveringspris", `${formatNumber(activationPrice)} kr/MWh`],
        ["Tilgjengelighetspris vinter", `${formatNumber(availabilityPriceWinter)} kr/MWh/t`],
        ["Timer/dag", `${hoursPerDay}`],
        ["Aktiveringer pr vinter", `${activationsPerWinter}`],
        ["Sommerinntekt", `${summerFactor}% av vinter`],
        ...(includeSolar ? [
          ["Solcelleanlegg", `${formatNumber(solarCapacity)} kWp`],
          ["Solproduksjon (brukerangitt)", `${formatNumber(solarProductionPerKwp)} kWh/kWp/år`],
          ["Forventet årsproduksjon", `${formatNumber(solarCapacity * solarProductionPerKwp)} kWh`],
          ["Egenforbruk uten batteri (brukerangitt)", `${selfConsumptionWithoutBattery}%`],
          ["Egenforbruk med batteri (brukerangitt)", `${selfConsumptionWithBattery}%`],
          ["Strømpris (brukerangitt)", `${spotPrice.toFixed(2)} kr/kWh`],
        ] : []),
        ["Investering", formatCurrency(investment)],
        ["Inkluderer estimater", includeEstimates ? "Ja" : "Nei"],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 36, 33], textColor: [212, 255, 0] },
      margin: { left: 20, right: 20 },
    });
    
    let yPos = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Årlig verdiskaping", 20, yPos);
    
    const tableBody = [
      ["Fleksibilitetsmarked", formatNumber(results.flexibilityIncome), formatPercent(results.flexibilityIncome / results.grossValue)],
    ];
    
    if (includeSolar) {
      tableBody.push(["Okt solutnyttelse (brukerangitt pris)", formatNumber(results.solarUtilizationValue), formatPercent(results.solarUtilizationValue / results.grossValue)]);
    }
    
    if (includeEstimates) {
      tableBody.push(["Peak shaving (ESTIMAT)", formatNumber(results.peakShavingValue), formatPercent(results.peakShavingValue / results.grossValue)]);
      tableBody.push(["Spot-arbitrage (ESTIMAT)", formatNumber(results.spotArbitrageValue), formatPercent(results.spotArbitrageValue / results.grossValue)]);
    }
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Inntektskilde", "Beløp (kr/år)", "Andel"]],
      body: tableBody,
      foot: [["Sum brutto verdi", formatNumber(results.grossValue), "100%"]],
      theme: "striped",
      headStyles: { fillColor: [34, 36, 33], textColor: [212, 255, 0] },
      footStyles: { fillColor: [212, 255, 0], textColor: [34, 36, 33], fontStyle: "bold" },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Nøkkeltall", 20, yPos);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Beskrivelse", "Verdi"]],
      body: [
        ["Brutto verdiskaping", formatCurrency(results.grossValue) + "/år"],
        ["Acron vederlag", formatCurrency(results.acronFee) + "/år"],
        ["Netto til byggeier", formatCurrency(results.netValue) + "/år"],
        ["Tilbakebetalingstid", `${results.paybackYears.toFixed(1)} år`],
        ["Årlig avkastning (ROI)", formatPercent(results.roi)],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 36, 33], textColor: [212, 255, 0] },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Fleksibilitetsmarked - Detaljert fordeling", 20, yPos);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Komponent", "Beløp (kr)"]],
      body: [
        ["Tilgjengelighet vinter (6 mnd)", formatNumber(flexBreakdown.pricePerWinter)],
        [`Tilgjengelighet sommer (${summerFactor}% av vinter)`, formatNumber(flexBreakdown.pricePerSummer)],
        ["Sum tilgjengelighet pr år", formatNumber(flexBreakdown.availabilityPerYear)],
        [`Aktiveringssum vinter (${activationsPerWinter} aktiveringer)`, formatNumber(flexBreakdown.activationSumWinter)],
      ],
      foot: [["Totalsum fleksibilitetsmarked", formatNumber(flexBreakdown.totalFlexIncome)]],
      theme: "striped",
      headStyles: { fillColor: [34, 36, 33], textColor: [212, 255, 0] },
      footStyles: { fillColor: [212, 255, 0], textColor: [34, 36, 33], fontStyle: "bold" },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Beregningsgrunnlag", 20, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const dataLines = [
      `Tilgjengelighetspris vinter: ${formatNumber(availabilityPriceWinter)} kr/MWh/t`,
      `Pris pr time: ${formatNumber(flexBreakdown.pricePerHour)} kr (${formatNumber(availabilityPriceWinter)} kr/MWh/t x ${batteryMW} MWh)`,
      `Pris pr dag: ${formatNumber(flexBreakdown.pricePerDay)} kr (${hoursPerDay} timer/dag)`,
      `Pris pr uke: ${formatNumber(flexBreakdown.pricePerWeek)} kr (5 virkedager)`,
      `Pris pr måned: ${formatNumber(flexBreakdown.pricePerMonth)} kr (4 uker)`,
      `Pris pr vinter: ${formatNumber(flexBreakdown.pricePerWinter)} kr (6 måneder)`,
      `Pris pr sommer: ${formatNumber(flexBreakdown.pricePerSummer)} kr (${summerFactor}% av vinterinntekt)`,
      `Aktiveringspris: ${formatNumber(activationPrice)} kr/MWh x ${batteryMW} MWh x ${activationsPerWinter} aktiveringer = ${formatNumber(flexBreakdown.activationSumWinter)} kr`,
    ];
    
    dataLines.forEach((line) => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    
    yPos += 5;
    
    if (includeEstimates || includeSolar) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Brukerangitte verdier og estimater", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const estimateLines = [];
      if (includeSolar) {
        estimateLines.push(`Strømpris (brukerangitt): ${spotPrice.toFixed(2)} kr/kWh`);
        estimateLines.push(`Solproduksjon (brukerangitt): ${solarProductionPerKwp} kWh/kWp/år`);
        estimateLines.push(`Egenforbruk uten batteri (brukerangitt): ${selfConsumptionWithoutBattery}%`);
        estimateLines.push(`Egenforbruk med batteri (brukerangitt): ${selfConsumptionWithBattery}%`);
      }
      if (includeEstimates) {
        estimateLines.push(`Peak shaving: ${ESTIMATES.peakShavingPerKw} kr/kW/år (estimat basert på typiske tariffer)`);
        estimateLines.push(`Spot-arbitrage: ${ESTIMATES.spotArbitragePerKwh} kr/kWh/år (estimat basert på historiske prisforskjeller)`);
      }
      estimateLines.push(`Acron vederlag: ${formatPercent(ACRON_FEE_PERCENTAGE)} av samlet inntekt/besparelse`);
      
      estimateLines.forEach((line) => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
    }
    
    yPos += 10;
    
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(255, 243, 205);
    doc.roundedRect(20, yPos, pageWidth - 40, 40, 3, 3, "F");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(133, 100, 4);
    doc.text("Viktige begrensninger", 25, yPos + 8);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const limitations = [
      "* Fleksinntekter er beregnet fra angitte priser og batterieffekt.",
      "* Faktisk inntekt kan variere basert pa lokale nettforhold, markedssituasjon og batteritilgjengelighet.",
      "* Verdier merket ESTIMAT er ikke verifisert og kan variere betydelig.",
      "* Ta kontakt med Acron for noyaktig prosjektvurdering.",
    ];
    
    limitations.forEach((line, i) => {
      doc.text(line, 25, yPos + 16 + (i * 5));
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("Acron Energy System - Lønnsomhetskalkulator", 20, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Side ${i} av ${totalPages}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 10);
    }
    
    doc.save(`acron-lønnsomhetsanalyse-${batteryPower}kWh-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-acron-dark via-acron-dark to-[hsl(68_40%_25%)]" data-testid="page-calculator">
      <header className="border-b border-white/10 bg-acron-dark/80 backdrop-blur-sm sticky top-0 z-50" data-testid="header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <img 
              src={acronLogo} 
              alt="Acron Energy System" 
              className="h-6 brightness-0 invert sepia saturate-[10000%] hue-rotate-[22deg]" 
              data-testid="img-logo" 
            />
          </div>
          <Badge variant="outline" className="border-acron-lime/50 text-acron-lime bg-acron-lime/10" data-testid="badge-calculator">
            Lønnsomhetskalkulator
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" data-testid="text-title">
            Lønnsomhetskalkulator for batterisystem
          </h1>
          <p className="text-white/70 text-lg max-w-3xl" data-testid="text-subtitle">
            Beregn potensiell avkastning fra fleksibilitetsmarkedet med valgfrie priser og parametere.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl" data-testid="card-battery">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Battery className="h-5 w-5 text-acron-lime" />
                  <CardTitle>Batterisystem</CardTitle>
                </div>
                <CardDescription>
                  Konfigurer batterieffekt og priser for fleksibilitetsmarkedet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="battery-power" className="text-base">Batterieffekt</Label>
                    <span className="text-lg font-semibold text-foreground" data-testid="text-battery-power">{formatNumber(batteryPower)} kWh ({batteryMW} MWh)</span>
                  </div>
                  <Slider
                    id="battery-power"
                    data-testid="slider-battery-power"
                    min={50}
                    max={1000}
                    step={10}
                    value={[batteryPower]}
                    onValueChange={(v) => setBatteryPower(v[0])}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50 kWh</span>
                    <span>1000 kWh</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Vinterpriser og aktiveringer</h4>
                  <p className="text-xs text-muted-foreground">Disse verdiene gjelder for vintersesongen (6 måneder)</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="activation-price" className="text-sm">Aktiveringspris</Label>
                    <Input
                      id="activation-price"
                      data-testid="input-activation-price"
                      type="number"
                      value={activationPrice}
                      onChange={(e) => setActivationPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability-price-winter" className="text-sm">Tilgjengelighetspris vinter (kr/MWh/t)</Label>
                    <Input
                      id="availability-price-winter"
                      data-testid="input-availability-price-winter"
                      type="number"
                      value={availabilityPriceWinter}
                      onChange={(e) => setAvailabilityPriceWinter(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours-per-day" className="text-sm">Timer pr dag</Label>
                    <Input
                      id="hours-per-day"
                      data-testid="input-hours-per-day"
                      type="number"
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activations-per-winter" className="text-sm">Aktiveringer pr vinter</Label>
                    <Input
                      id="activations-per-winter"
                      data-testid="input-activations-per-winter"
                      type="number"
                      value={activationsPerWinter}
                      onChange={(e) => setActivationsPerWinter(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="summer-factor" className="text-base">Tilgjengelighetspris sommer</Label>
                    <span className="text-lg font-semibold text-foreground" data-testid="text-summer-factor">{summerFactor}% av vinter</span>
                  </div>
                  <Slider
                    id="summer-factor"
                    data-testid="slider-summer-factor"
                    min={0}
                    max={100}
                    step={5}
                    value={[summerFactor]}
                    onValueChange={(v) => setSummerFactor(v[0])}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50% (standard)</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50" data-testid="info-winter-income">
                    <p className="text-sm text-muted-foreground">Vinter tilgj.</p>
                    <p className="text-base font-semibold">{formatCurrency(flexBreakdown.pricePerWinter)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50" data-testid="info-summer-income">
                    <p className="text-sm text-muted-foreground">Sommer tilgj.</p>
                    <p className="text-base font-semibold">{formatCurrency(flexBreakdown.pricePerSummer)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50" data-testid="info-activation-sum">
                    <p className="text-sm text-muted-foreground">Aktiveringssum</p>
                    <p className="text-base font-semibold">{formatCurrency(flexBreakdown.activationSumWinter)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl" data-testid="card-solar">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <CardTitle>Solcelleanlegg</CardTitle>
                    <Tooltip>
                      <TooltipTrigger data-testid="tooltip-solar-info">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Solberegning bruker bransjestandard for produksjon og din angitte strømpris. Egenforbruksandeler er estimater.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    id="include-solar"
                    data-testid="switch-include-solar"
                    checked={includeSolar}
                    onCheckedChange={setIncludeSolar}
                  />
                </div>
                <CardDescription>
                  Inkluder solcelleanlegg i beregningen
                </CardDescription>
              </CardHeader>
              {includeSolar && (
                <CardContent className="space-y-6">
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800" data-testid="info-solar-user-values">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      <strong>Brukerangitte verdier:</strong> Alle solverdier nedenfor må angis av deg basert på ditt spesifikke prosjekt. 
                      Standardverdier er fra prosjekteksempel.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="solar-capacity" className="text-base">Installert effekt</Label>
                      <span className="text-lg font-semibold text-yellow-500" data-testid="text-solar-capacity">{formatNumber(solarCapacity)} kWp</span>
                    </div>
                    <Slider
                      id="solar-capacity"
                      data-testid="slider-solar-capacity"
                      min={10}
                      max={1000}
                      step={5}
                      value={[solarCapacity]}
                      onValueChange={(v) => setSolarCapacity(v[0])}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10 kWp</span>
                      <span>1000 kWp</span>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="solar-production">Solproduksjon (kWh/kWp/år)</Label>
                      <Input
                        id="solar-production"
                        data-testid="input-solar-production"
                        type="number"
                        min="0"
                        value={solarProductionPerKwp}
                        onChange={(e) => setSolarProductionPerKwp(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spot-price">Strømpris (kr/kWh)</Label>
                      <Input
                        id="spot-price"
                        data-testid="input-spot-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={spotPrice}
                        onChange={(e) => setSpotPrice(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="self-consumption-without">Egenforbruk uten batteri (%)</Label>
                      <Input
                        id="self-consumption-without"
                        data-testid="input-self-consumption-without"
                        type="number"
                        min="0"
                        max="100"
                        value={selfConsumptionWithoutBattery}
                        onChange={(e) => setSelfConsumptionWithoutBattery(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="self-consumption-with">Egenforbruk med batteri (%)</Label>
                      <Input
                        id="self-consumption-with"
                        data-testid="input-self-consumption-with"
                        type="number"
                        min="0"
                        max="100"
                        value={selfConsumptionWithBattery}
                        onChange={(e) => setSelfConsumptionWithBattery(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50" data-testid="info-solar-production">
                      <p className="text-sm text-muted-foreground">Forventet årsproduksjon</p>
                      <p className="text-lg font-semibold">{formatNumber(solarCapacity * solarProductionPerKwp)} kWh</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50" data-testid="info-solar-increase">
                      <p className="text-sm text-muted-foreground">Økt egenforbruk med batteri</p>
                      <p className="text-lg font-semibold">+{selfConsumptionWithBattery - selfConsumptionWithoutBattery}%</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="border-0 shadow-xl" data-testid="card-estimates">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <CardTitle>Tilleggsbesparelser</CardTitle>
                    <Badge variant="outline" className="border-orange-500/50 text-orange-500" data-testid="badge-estimate">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Estimater
                    </Badge>
                  </div>
                  <Switch
                    id="include-estimates"
                    data-testid="switch-include-estimates"
                    checked={includeEstimates}
                    onCheckedChange={setIncludeEstimates}
                  />
                </div>
                <CardDescription>
                  Inkluder estimerte verdier for peak shaving og spot-arbitrage. Disse er ikke verifisert.
                </CardDescription>
              </CardHeader>
              {includeEstimates && (
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800" data-testid="info-estimates-warning">
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                      <strong>OBS:</strong> Disse verdiene er estimater og ikke basert på verifiserte data. 
                      Faktiske besparelser avhenger av byggets forbruksmønster og strømpriser.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50" data-testid="info-peak-shaving-rate">
                      <p className="text-sm text-muted-foreground">Peak shaving (estimat)</p>
                      <p className="text-lg font-semibold">{ESTIMATES.peakShavingPerKw} kr/kW/år</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50" data-testid="info-arbitrage-rate">
                      <p className="text-sm text-muted-foreground">Spot-arbitrage (estimat)</p>
                      <p className="text-lg font-semibold">{ESTIMATES.spotArbitragePerKwh} kr/kWh/år</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="border-0 shadow-xl" data-testid="card-investment">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-green-500" />
                  <CardTitle>Investering</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="investment">Investeringsbeløp (NOK eks. mva)</Label>
                  <Input
                    id="investment"
                    data-testid="input-investment"
                    type="number"
                    value={investment}
                    onChange={(e) => setInvestment(Number(e.target.value))}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">Inkluderer typisk kraning, montasje og el.arbeider. Ekskluderer fundament.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto z-10">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-acron-dark to-[hsl(68_30%_20%)] text-white" data-testid="card-results">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-acron-lime" />
                  <CardTitle className="text-white">Resultat</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5" data-testid="result-flexibility">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-acron-lime" />
                      <span className="text-sm text-white/80">Fleksibilitetsmarked</span>
                    </div>
                    <span className="font-semibold" data-testid="text-flexibility-value">{formatCurrency(results.flexibilityIncome)}</span>
                  </div>
                  
                  {includeSolar && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5" data-testid="result-solar">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-white/80">Økt solutnyttelse</span>
                      </div>
                      <span className="font-semibold" data-testid="text-solar-value">{formatCurrency(results.solarUtilizationValue)}</span>
                    </div>
                  )}
                  
                  {includeEstimates && (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5" data-testid="result-peak-shaving">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-white/80">Peak shaving</span>
                          <Badge variant="outline" className="text-[10px] border-orange-400/50 text-orange-400">Estimat</Badge>
                        </div>
                        <span className="font-semibold" data-testid="text-peak-shaving-value">{formatCurrency(results.peakShavingValue)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5" data-testid="result-arbitrage">
                        <div className="flex items-center gap-2">
                          <PiggyBank className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-white/80">Spot-arbitrage</span>
                          <Badge variant="outline" className="text-[10px] border-orange-400/50 text-orange-400">Estimat</Badge>
                        </div>
                        <span className="font-semibold" data-testid="text-arbitrage-value">{formatCurrency(results.spotArbitrageValue)}</span>
                      </div>
                    </>
                  )}
                </div>
                
                <Separator className="bg-white/20" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between" data-testid="result-gross">
                    <span className="text-white/80">Brutto verdiskaping</span>
                    <span className="font-semibold text-lg" data-testid="text-gross-value">{formatCurrency(results.grossValue)}/år</span>
                  </div>
                  <div className="flex items-center justify-between text-sm" data-testid="result-fee">
                    <span className="text-white/60">Acron vederlag</span>
                    <span className="text-white/60" data-testid="text-fee-value">-{formatCurrency(results.acronFee)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/20" data-testid="result-net">
                    <span className="font-semibold text-acron-lime">Netto til byggeier</span>
                    <span className="font-bold text-xl text-acron-lime" data-testid="text-net-value">{formatCurrency(results.netValue)}/år</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-acron-lime/20 text-center" data-testid="result-payback">
                    <div className="flex items-center justify-center gap-1 text-acron-lime mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-wide">Tilbakebetaling</span>
                    </div>
                    <span className="text-2xl font-bold text-white" data-testid="text-payback-value">{results.paybackYears.toFixed(1)} år</span>
                  </div>
                  <div className="p-3 rounded-lg bg-acron-lime/20 text-center" data-testid="result-roi">
                    <div className="flex items-center justify-center gap-1 text-acron-lime mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-wide">ROI</span>
                    </div>
                    <span className="text-2xl font-bold text-white" data-testid="text-roi-value">{formatPercent(results.roi)}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={generatePDF}
                  data-testid="button-download-pdf"
                  className="w-full bg-acron-lime text-acron-dark font-semibold"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Last ned PDF-rapport
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl" data-testid="card-flex-breakdown">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-acron-lime" />
                  <CardTitle className="text-base">Fleksibilitetsberegning</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2 text-muted-foreground" data-testid="info-flex-breakdown">
                  <p><span className="font-medium text-foreground">Pris pr time:</span> {formatCurrency(flexBreakdown.pricePerHour)}</p>
                  <p><span className="font-medium text-foreground">Pris pr dag:</span> {formatCurrency(flexBreakdown.pricePerDay)}</p>
                  <p><span className="font-medium text-foreground">Pris pr uke:</span> {formatCurrency(flexBreakdown.pricePerWeek)}</p>
                  <p><span className="font-medium text-foreground">Pris pr måned:</span> {formatCurrency(flexBreakdown.pricePerMonth)}</p>
                  <p className="pt-1 border-t"><span className="font-medium text-foreground">Vinter (6 mnd):</span> {formatCurrency(flexBreakdown.pricePerWinter)}</p>
                  <p><span className="font-medium text-foreground">Sommer ({summerFactor}%):</span> {formatCurrency(flexBreakdown.pricePerSummer)}</p>
                  <p><span className="font-medium text-foreground">Aktivering:</span> {formatCurrency(flexBreakdown.activationSumWinter)}</p>
                  <p className="pt-1 border-t font-semibold text-foreground">Totalsum: {formatCurrency(flexBreakdown.totalFlexIncome)}/år</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8 border-0 shadow-xl border-l-4 border-l-yellow-500" data-testid="card-limitations">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg" data-testid="text-limitations-title">Viktige begrensninger og forutsetninger</h3>
                <ul className="space-y-2 text-muted-foreground" data-testid="list-limitations">
                  <li className="flex items-start gap-2">
                    <span className="text-acron-lime mt-1 font-bold">•</span>
                    <span><strong>Fleksibilitetsinntekter</strong> beregnes fra angitte priser (aktivering, tilgjengelighet vinter/sommer) og batterieffekt.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1 font-bold">!</span>
                    <span><strong>Solverdier (BRUKERANGITT)</strong> - solproduksjon, egenforbruk og strømpris må angis av deg basert på ditt prosjekt. Standardverdier er eksempelverdier.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1 font-bold">?</span>
                    <span><strong>Peak shaving og spot-arbitrage (ESTIMAT)</strong> er ikke verifisert og kan variere betydelig basert på forbruksmønster og strømpriser.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span><strong>Investering</strong> inkluderer ikke fundament eller spesielle tilpasninger. Ta kontakt for nøyaktig pristilbud.</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <footer className="mt-12 pt-8 border-t border-white/10 text-center text-white/50 text-sm" data-testid="footer">
          <p>Acron Energy System™ | Lønnsomhetskalkulator</p>
          <p className="mt-1">Beregn lønnsomhet for ditt batteriprosjekt</p>
        </footer>
      </main>
    </div>
  );
}

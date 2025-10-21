import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, DollarSign } from 'lucide-react';
const RoiCalculator = () => {
  // Input states with sane defaults
  const [calls, setCalls] = useState(120);
  const [currentAnswer, setCurrentAnswer] = useState(55);
  const [conv, setConv] = useState(35);
  const [value, setValue] = useState(280);
  const [tlCapture, setTlCapture] = useState(90);

  // Calculated results
  const [results, setResults] = useState({
    answeredNow: 0,
    missedNow: 0,
    recoveredByTL: 0,
    qualifiedAppts: 0,
    commissionCost: 0,
    monthlyRevenue: 0,
    roiCommission: 0,
    roiPredictable: 0,
    bestPlan: 'Predictable'
  });

  // Currency formatter (en-CA)
  const cad = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0
  });

  // Calculations (with formulas in comments)
  useEffect(() => {
    // answeredNow = calls * (currentAnswer/100)
    const answeredNow = calls * (currentAnswer / 100);

    // missedNow = calls - answeredNow
    const missedNow = calls - answeredNow;

    // recoveredByTL = missedNow * (tlCapture/100)
    const recoveredByTL = missedNow * (tlCapture / 100);

    // qualifiedAppts = recoveredByTL * (conv/100)
    const qualifiedAppts = recoveredByTL * (conv / 100);

    // Commission cost = 149 setup (amortized over 12 months) + qualifiedAppts * 0
    // For first month comparison, include full setup fee
    const commissionCost = 149;

    // Monthly revenue gained = qualifiedAppts * value
    const monthlyRevenue = qualifiedAppts * value;

    // ROI (Commission) = (revenue - commissionCost) / max(commissionCost,1)
    const roiCommission = (monthlyRevenue - commissionCost) / Math.max(commissionCost, 1);

    // ROI (Predictable) = (revenue - (69 + 249)) / (69 + 249)
    // First month includes setup fee
    const predictableCost = 69 + 249;
    const roiPredictable = (monthlyRevenue - predictableCost) / predictableCost;

    // Best value logic
    const netCommission = monthlyRevenue - commissionCost;
    const netPredictable = monthlyRevenue - predictableCost;
    const bestPlan = netCommission === netPredictable ? "Predictable" : netCommission > netPredictable ? "Commission" : "Predictable";
    setResults({
      answeredNow,
      missedNow,
      recoveredByTL,
      qualifiedAppts,
      commissionCost,
      monthlyRevenue,
      roiCommission,
      roiPredictable,
      bestPlan
    });
  }, [calls, currentAnswer, conv, value, tlCapture]);
  return <Card className="w-full bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg md:text-xl text-foreground mb-1">
          Calculate Your ROI
        </CardTitle>
        <p className="text-muted-foreground">
          See how much revenue you could recover with TradeLine 24/7
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left Column: Inputs */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground mb-3">Your Business</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="calls" className="text-sm font-medium text-foreground">
                  Monthly inbound calls
                </Label>
                <input id="calls" type="number" min="0" value={calls} onChange={e => setCalls(Number(e.target.value) || 0)} className="w-full mt-1 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>

              <div>
                <Label htmlFor="currentAnswer" className="text-sm font-medium text-foreground">
                  Current answer rate (%)
                </Label>
                <input id="currentAnswer" type="number" min="0" max="100" value={currentAnswer} onChange={e => setCurrentAnswer(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className="w-full mt-1 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>

              <div>
                <Label htmlFor="conv" className="text-sm font-medium text-foreground">
                  Appointment conversion when answered (%)
                </Label>
                <input id="conv" type="number" min="0" max="100" value={conv} onChange={e => setConv(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className="w-full mt-1 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>

              <div>
                <Label htmlFor="value" className="text-sm font-medium text-foreground">
                  Avg revenue per appointment (CAD)
                </Label>
                <input id="value" type="number" min="0" value={value} onChange={e => setValue(Number(e.target.value) || 0)} className="w-full mt-1 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>

              <div>
                <Label htmlFor="tlCapture" className="text-sm font-medium text-foreground">
                  Our after-hours capture (%)
                </Label>
                <input id="tlCapture" type="number" min="0" max="100" value={tlCapture} onChange={e => setTlCapture(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className="w-full mt-1 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground mb-3">Your Results</h3>
            
            <div className="space-y-3" aria-live="polite" aria-label="ROI calculation results">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground px-0 mx-0 text-xs -ml-[3px]">Recovered appointments</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(results.qualifiedAppts)}
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Projected revenue (CAD)</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {cad.format(results.monthlyRevenue)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Cost (Commission)</span>
                  <span className="font-medium text-foreground">{cad.format(results.commissionCost)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Cost (Predictable) - 1st month</span>
                  <span className="font-medium text-foreground">{cad.format(318)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">ROI (Commission)</span>
                  <span className="font-medium text-primary">{Math.round(results.roiCommission * 100)}%</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">ROI (Predictable)</span>
                  <span className="font-medium text-primary">{Math.round(results.roiPredictable * 100)}%</span>
                </div>
              </div>

              <Badge className="w-full justify-center py-2 bg-primary text-primary-foreground">
                Best value this month: {results.bestPlan}
              </Badge>

              <div className="space-y-2 pt-2">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                  <a href="/auth?plan=commission">Start Zero-Monthly</a>
                </Button>
                
                <Button size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                  <a href="/auth?plan=core">Choose Predictable</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default RoiCalculator;

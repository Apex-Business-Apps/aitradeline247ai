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
    
    // Commission cost = qualifiedAppts * 149
    const commissionCost = qualifiedAppts * 149;
    
    // Monthly revenue gained = qualifiedAppts * value
    const monthlyRevenue = qualifiedAppts * value;
    
    // ROI (Commission) = (revenue - commissionCost) / max(commissionCost,1)
    const roiCommission = (monthlyRevenue - commissionCost) / Math.max(commissionCost, 1);
    
    // ROI (Predictable) = (revenue - 249) / 249
    const roiPredictable = (monthlyRevenue - 249) / 249;

    // Best value logic
    const netCommission = monthlyRevenue - commissionCost;
    const netPredictable = monthlyRevenue - 249;
    const bestPlan = netCommission === netPredictable
      ? "Predictable"
      : (netCommission > netPredictable ? "Commission" : "Predictable");

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

  return (
    <Card className="w-full max-w-6xl mx-auto bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl md:text-3xl text-foreground mb-2">
          Calculate Your ROI
        </CardTitle>
        <p className="text-muted-foreground">
          See how much revenue you could recover with TradeLine 24/7
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Business</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="calls" className="text-sm font-medium text-foreground">
                  Monthly inbound calls
                </Label>
                <input
                  id="calls"
                  type="number"
                  min="0"
                  value={calls}
                  onChange={(e) => setCalls(Number(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <Label htmlFor="currentAnswer" className="text-sm font-medium text-foreground">
                  Current answer rate (%)
                </Label>
                <input
                  id="currentAnswer"
                  type="number"
                  min="0"
                  max="100"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <Label htmlFor="conv" className="text-sm font-medium text-foreground">
                  Appointment conversion when answered (%)
                </Label>
                <input
                  id="conv"
                  type="number"
                  min="0"
                  max="100"
                  value={conv}
                  onChange={(e) => setConv(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <Label htmlFor="value" className="text-sm font-medium text-foreground">
                  Avg revenue per appointment (CAD)
                </Label>
                <input
                  id="value"
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <Label htmlFor="tlCapture" className="text-sm font-medium text-foreground">
                  Our after-hours capture (%)
                </Label>
                <input
                  id="tlCapture"
                  type="number"
                  min="0"
                  max="100"
                  value={tlCapture}
                  onChange={(e) => setTlCapture(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Results</h3>
            
            <div 
              className="space-y-4"
              aria-live="polite"
              aria-label="ROI calculation results"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Recovered appointments</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(results.qualifiedAppts)}
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Projected revenue (CAD)</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {cad.format(results.monthlyRevenue)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Cost — Commission</span>
                  <span className="font-medium text-foreground">{cad.format(results.commissionCost)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Cost — Predictable</span>
                  <span className="font-medium text-foreground">{cad.format(249)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">ROI — Commission</span>
                  <span className="font-medium text-primary">{Math.round(results.roiCommission * 100)}%</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">ROI — Predictable</span>
                  <span className="font-medium text-primary">{Math.round(results.roiPredictable * 100)}%</span>
                </div>
              </div>

              <Badge className="w-full justify-center py-2 bg-primary text-primary-foreground">
                Best value this month: {results.bestPlan}
              </Badge>

              <div className="space-y-3 pt-4">
                <Button 
                  size="lg" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => window.location.href = '/signup?plan=commission'}
                >
                  Start Commission-Only
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => window.location.href = '/signup?plan=core'}
                >
                  Choose Predictable
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoiCalculator;
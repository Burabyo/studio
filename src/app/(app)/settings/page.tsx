"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/context/currency-context";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings, tax brackets, and contributions.
        </p>
      </header>
      <Card>
        <CardHeader>
            <CardTitle>Application Configuration</CardTitle>
            <CardDescription>Configure the default currency for the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Currency</Label>
             <RadioGroup 
                defaultValue={currency} 
                onValueChange={(value) => setCurrency(value as 'USD' | 'RWF')}
                className="flex items-center space-x-4"
              >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="USD" id="usd" />
                <Label htmlFor="usd">USD ($)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="RWF" id="rwf" />
                <Label htmlFor="rwf">RWF (FRw)</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="text-center pt-8">
            <p className="text-muted-foreground">Other features like tax brackets are coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

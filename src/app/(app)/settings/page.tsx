import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings, tax brackets, and contributions.
        </p>
      </header>
      <Card className="text-center">
        <CardHeader>
            <CardTitle>Application Configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-16">
          <p className="text-muted-foreground">This feature is coming soon.</p>
          <p>You will be able to define tax brackets, contribution rates, and other settings.</p>
          <Button disabled>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}

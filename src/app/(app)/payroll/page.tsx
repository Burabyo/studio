import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Process Payroll</h1>
        <p className="text-muted-foreground">
          Run monthly payroll, review summaries, and process payments.
        </p>
      </header>
      <Card className="text-center">
        <CardHeader>
            <CardTitle>June 2024 Payroll</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-16">
          <p className="text-muted-foreground">This feature is coming soon.</p>
          <p>You will be able to view monthly summaries and process payroll with a single click.</p>
          <Button disabled>Process Payroll for June</Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { PayslipGenerator } from "./_components/payslip-generator";

export default function PayslipsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Generate Payslip</h1>
        <p className="text-muted-foreground">
          Use AI to generate accurate and professional payslips for your employees.
        </p>
      </header>
      <PayslipGenerator />
    </div>
  );
}

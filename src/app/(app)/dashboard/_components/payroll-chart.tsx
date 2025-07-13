"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useCurrency } from "@/context/currency-context";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const chartData = [
  { month: "Jan", payroll: 4000 },
  { month: "Feb", payroll: 3000 },
  { month: "Mar", payroll: 5000 },
  { month: "Apr", payroll: 4500 },
  { month: "May", payroll: 6000 },
  { month: "Jun", payroll: 5500 },
];

const chartConfig = {
  payroll: {
    label: "Payroll",
    color: "hsl(var(--primary))",
  },
};

export function PayrollChart() {
  const { formatCurrency } = useCurrency();
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => {
             if (value >= 1000000) return `${formatCurrency(value / 1000000)}M`
             if (value >= 1000) return `${formatCurrency(value / 1000)}K`
             return formatCurrency(value)
          }}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(Number(value))}/>}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="payroll" fill="var(--color-payroll)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

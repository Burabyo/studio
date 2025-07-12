"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
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
          tickFormatter={(value) => `$${value / 1000}K`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="payroll" fill="var(--color-payroll)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

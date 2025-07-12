import type { SVGProps } from "react";

export function PaypulseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4h16v16H4z" fill="var(--sidebar-background)" />
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="hsl(var(--primary))" />
      <path d="M16 16a4 4 0 0 0-8 0" stroke="hsl(var(--accent))" />
      <path d="M12 6V4" stroke="hsl(var(--primary))" />
      <path d="M12 20v-2" stroke="hsl(var(--accent))" />
    </svg>
  );
}

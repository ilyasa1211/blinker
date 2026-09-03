export type Theme = "light" | "dark" | "system";

export interface Breakpoint {
  id: string;
  interval: number;
  intervalUnit: "second" | "minute";
  duration: number;
  durationUnit: "second" | "minute";
  enabled: boolean;
}

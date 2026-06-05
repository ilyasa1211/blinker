export interface Breakpoint {
  id: string;
  /**
   * Repeat every x (minute/second).
   */
  interval: number;
  intervalUnit: "second" | "minute";

  /**
   * How long this break will last (minute/second).
   */
  duration: number;
  durationUnit: "second" | "minute";
}

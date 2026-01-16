// global.d.ts
export {};

declare global {
  type GtagConfig = {
    page_path?: string;
  };

  type GtagFn = (command: "config", targetId: string, config?: GtagConfig) => void;

  interface Window {
    gtag?: GtagFn;
  }
}

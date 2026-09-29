export type PaletteName =
  | "Vibrant"
  | "DarkVibrant"
  | "LightVibrant"
  | "Muted"
  | "DarkMuted"
  | "LightMuted";

export type ContrastGrade = "AAA" | "AA" | "AA Large" | "Fail";

export interface Photo {
  id: string;
  url: string;
  thumbUrl: string;
  tinyUrl: string;
  color: string;
  width: number;
  height: number;
  alt: string;
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
}

export interface PaletteSwatch {
  name: PaletteName;
  hex: string;
  population: number;
  vibrancy: number;
}

export type ExtractedPalette = Partial<Record<PaletteName, PaletteSwatch>>;

export interface ColorPair {
  background: string;
  foreground: string;
  originalForeground: string;
  wasBumped: boolean;
  palette: ExtractedPalette;
}

export interface ContrastScore {
  algorithm: "WCAG";
  value: number;
  grade: ContrastGrade;
  description: string;
}

export type ControlBarState = "default" | "export";

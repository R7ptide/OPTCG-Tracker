import { createContext, useContext } from "react";
import { type ThemeColors } from "../constants/theme";

export type SettingsContextValue = {
  showMissing: boolean;
  setShowMissing: (val: boolean) => void;
  isLightMode: boolean;
  toggleLightMode: () => void;
  colors: ThemeColors;
};

export const SettingsContext = createContext<SettingsContextValue | null>(
  null,
);

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
};

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchGameData } from "../constants/gameData";

type GameDataSets = {
  mainSets: string[];
  extraBoosters: string[];
  starterDecks: string[];
  premiumBoosters: string[];
};

type GameDataContextType = GameDataSets & {
  isLoading: boolean;
};

const GameDataContext = createContext<GameDataContextType | null>(null);

export const GameDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [data, setData] = useState<GameDataSets>({
    mainSets: [],
    extraBoosters: [],
    starterDecks: [],
    premiumBoosters: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const remoteData = await fetchGameData();

      const range = (count: number, prefix: string) =>
        Array.from(
          { length: count },
          (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`,
        );

      setData({
        mainSets: range(remoteData.mainSetCount ?? 16, "OP"),
        extraBoosters: range(remoteData.extraBoosterCount ?? 4, "EB"),
        starterDecks: range(remoteData.starterDeckCount ?? 30, "ST"),
        premiumBoosters: range(remoteData.premiumBoostersCount ?? 2, "PRB"),
      });
      setIsLoading(false);
    };

    loadData();
  }, []);

  return (
    <GameDataContext.Provider value={{ ...data, isLoading }}>
      {children}
    </GameDataContext.Provider>
  );
};

export const useGameData = () => {
  const context = useContext(GameDataContext);
  if (!context)
    throw new Error("useGameData must be used within a GameDataProvider");
  return context;
};

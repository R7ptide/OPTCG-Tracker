import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchGameData } from "../constants/gameData";
import { type GameDataSets } from "../utils/sets";

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
      setData(await fetchGameData());
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

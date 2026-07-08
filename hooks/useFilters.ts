import { useState } from "react";
import type { FilterKey } from "../constants/gameData";

export type Filters = {
  searchName: string;
  colors: string[];
  types: string[];
  rarities: string[];
};

const INITIAL: Filters = {
  searchName: "",
  colors: [],
  types: [],
  rarities: [],
};

export const useFilters = () => {
  const [filters, setFilters] = useState<Filters>(INITIAL);

  const setSearchName = (searchName: string) =>
    setFilters((f) => ({ ...f, searchName }));

  const toggle = (key: FilterKey, value: string) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }));

  const reset = () => setFilters(INITIAL);

  return { filters, setSearchName, toggle, reset };
};

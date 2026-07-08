import { useState } from "react";

const INITIAL = {
  searchName: "",
  colors: [],
  types: [],
  rarities: [],
};

export const useFilters = () => {
  const [filters, setFilters] = useState(INITIAL);

  const setSearchName = (searchName) =>
    setFilters((f) => ({ ...f, searchName }));

  const toggle = (key, value) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }));

  const reset = () => setFilters(INITIAL);

  return { filters, setSearchName, toggle, reset };
};

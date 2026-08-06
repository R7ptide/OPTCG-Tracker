import { useMemo } from "react";

// Builds the "All" + distinct-formats list used by the tournament list and
// stats filters, with "Legacy" pinned first and the rest newest-first.
export const useAvailableFormats = (
  tournaments: { format: string }[],
): string[] => {
  return useMemo(() => {
    const formats = Array.from(new Set(tournaments.map((t) => t.format)));
    formats.sort((a, b) => {
      if (a === "Legacy") return -1;
      if (b === "Legacy") return 1;
      return b.localeCompare(a);
    });

    return ["All", ...formats];
  }, [tournaments]);
};

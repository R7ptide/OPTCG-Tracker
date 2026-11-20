import { getKeywordStyle, type KeywordStyle } from "../constants/keywordStyles";

export type EffectSegment =
  | { type: "text"; text: string }
  | { type: "keyword"; text: string; style: KeywordStyle };

// Splits effect text into plain text and styled keywords. A bracket with no
// style (a card name such as "[Sanji]") is kept as plain text, brackets
// included, so no wording is ever lost.
export const parseEffectText = (text: string): EffectSegment[] => {
  const segments: EffectSegment[] = [];
  let plain = "";

  const flush = () => {
    if (plain !== "") segments.push({ type: "text", text: plain });
    plain = "";
  };

  let last = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]/g)) {
    const style = getKeywordStyle(match[1]);
    plain += text.slice(last, match.index);
    last = match.index + match[0].length;

    if (style) {
      flush();
      segments.push({ type: "keyword", text: match[1], style });
    } else {
      plain += match[0];
    }
  }
  plain += text.slice(last);
  flush();

  return segments;
};

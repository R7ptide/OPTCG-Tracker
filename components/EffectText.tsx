import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { parseEffectText } from "../utils/effectText";
import { radius } from "../constants/theme";

// Tweak if chips look too high or low next to the text.
const CHIP_BASELINE_OFFSET = 5;

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
};

// Card effect text with its [Keywords] drawn as colored chips inline.
export default function EffectText({ text, style }: Props) {
  return (
    <Text style={style}>
      {parseEffectText(text).map((segment, index) =>
        segment.type === "text" ? (
          segment.text
        ) : (
          <View
            key={index}
            style={[
              styles.chip,
              {
                backgroundColor: segment.style.background,
                borderRadius:
                  segment.style.shape === "rounded" ? radius.pill : 4,
                borderColor: segment.style.border ?? segment.style.background,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: segment.style.text }]}>
              {segment.text}
            </Text>
          </View>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginHorizontal: 2,
    // An inline view's bottom edge sits on the text baseline, which leaves
    // the chip riding high. Pushing it down centers it on the line.
    transform: [{ translateY: CHIP_BASELINE_OFFSET }],
  },
  chipText: { fontSize: 12, lineHeight: 14, fontWeight: "bold" },
});

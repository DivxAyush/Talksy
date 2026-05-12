import React from "react";
import { View, Animated, StyleSheet } from "react-native";
import { spacing, radius } from "../../theme/designTokens";

const TypingBubble = React.memo(({ otherBubble, dot1, dot2, dot3, textSub }) => {
  return (
    <View style={[s.bubbleWrap, s.bubbleLeft]}>
      <View style={[s.bubble, { backgroundColor: otherBubble }]}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View
            key={i}
            style={[
              s.typingDot,
              { backgroundColor: textSub, transform: [{ translateY: d }], opacity: 0.7 },
              i > 0 && { marginLeft: spacing.xs + 1 },
            ]}
          />
        ))}
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  bubbleWrap: {
    marginBottom: spacing.sm,
    maxWidth: "78%",
    alignSelf: "flex-start",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.bubble,
    borderBottomLeftRadius: radius.bubbleTail,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

export default TypingBubble;

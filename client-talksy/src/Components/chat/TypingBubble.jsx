import React from "react";
import { View, Animated, StyleSheet } from "react-native";

const TypingBubble = React.memo(({ otherBubble, dot1, dot2, dot3, textSub }) => {
  return (
    <View style={[s.bubbleWrap, s.bubbleLeft]}>
      <View style={[s.bubble, { backgroundColor: otherBubble, flexDirection: "row", paddingHorizontal: 18, paddingVertical: 14 }]}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={[s.typingDot, { backgroundColor: textSub, transform: [{ translateY: d }], marginHorizontal: 3 }]} />
        ))}
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  bubbleWrap: { marginBottom: 6, maxWidth: "78%", alignSelf: "flex-start" },
  bubble: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4, borderRadius: 18 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
});

export default TypingBubble;

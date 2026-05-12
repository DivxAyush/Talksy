import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

// ─── Shimmer Bone (single animated placeholder bar) ───
const ShimmerBone = React.memo(({ width, height, borderRadius = 8, style, baseColor, highlightColor }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: baseColor || "#e9edef", opacity },
        style,
      ]}
    />
  );
});

// ─── Chat List Skeleton Row ───
const ChatSkeletonRow = React.memo(({ baseColor, highlightColor }) => (
  <View style={s.row}>
    <ShimmerBone width={52} height={52} borderRadius={26} baseColor={baseColor} highlightColor={highlightColor} />
    <View style={s.rowContent}>
      <View style={s.rowTop}>
        <ShimmerBone width={120} height={14} borderRadius={7} baseColor={baseColor} highlightColor={highlightColor} />
        <ShimmerBone width={40} height={10} borderRadius={5} baseColor={baseColor} highlightColor={highlightColor} />
      </View>
      <ShimmerBone width={180} height={12} borderRadius={6} baseColor={baseColor} highlightColor={highlightColor} style={{ marginTop: 8 }} />
    </View>
  </View>
));

// ─── Chat List Skeleton (multiple rows) ───
export const ChatListSkeleton = React.memo(({ count = 8, baseColor, highlightColor }) => (
  <View style={s.container}>
    {Array.from({ length: count }, (_, i) => (
      <ChatSkeletonRow key={i} baseColor={baseColor} highlightColor={highlightColor} />
    ))}
  </View>
));

// ─── Message Skeleton (for chat loading) ───
const MessageSkeletonBubble = React.memo(({ isRight, width, baseColor }) => (
  <View style={[s.msgRow, isRight ? s.msgRight : s.msgLeft]}>
    <ShimmerBone
      width={width}
      height={40}
      borderRadius={16}
      baseColor={baseColor}
    />
  </View>
));

export const MessageListSkeleton = React.memo(({ baseColor }) => (
  <View style={s.msgContainer}>
    <MessageSkeletonBubble isRight={false} width={200} baseColor={baseColor} />
    <MessageSkeletonBubble isRight width={160} baseColor={baseColor} />
    <MessageSkeletonBubble isRight width={220} baseColor={baseColor} />
    <MessageSkeletonBubble isRight={false} width={140} baseColor={baseColor} />
    <MessageSkeletonBubble isRight={false} width={180} baseColor={baseColor} />
    <MessageSkeletonBubble isRight width={190} baseColor={baseColor} />
  </View>
));

const s = StyleSheet.create({
  container: { paddingTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  rowContent: { flex: 1, marginLeft: 14 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Messages
  msgContainer: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  msgRow: { maxWidth: "80%" },
  msgRight: { alignSelf: "flex-end" },
  msgLeft: { alignSelf: "flex-start" },
});

export default ShimmerBone;

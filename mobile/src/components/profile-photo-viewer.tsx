import { Image } from "expo-image";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { GestureViewer } from "react-native-gesture-image-viewer";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";

type ProfilePhotoViewerProps = {
  visible: boolean;
  imageUrl: string | null;
  onRequestClose: () => void;
};

export function ProfilePhotoViewer({
  visible,
  imageUrl,
  onRequestClose,
}: ProfilePhotoViewerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      presentationStyle="fullScreen"
      transparent={false}
      visible={visible && Boolean(imageUrl)}
    >
      <SafeAreaView style={styles.safeArea}>
        {imageUrl ? (
          <GestureViewer
            ListComponent={ScrollView}
            backdropStyle={styles.backdrop}
            data={[imageUrl]}
            dismiss={{
              enabled: true,
              fadeBackdrop: true,
              resistance: 2,
              threshold: 80,
            }}
            enableDoubleTapZoom
            enableHorizontalSwipe={false}
            enablePinchZoom
            maxZoomScale={6}
            onDismiss={onRequestClose}
            renderContainer={(children, { dismiss }) => (
              <SafeAreaView style={styles.safeArea}>
                <Pressable
                  accessibilityLabel="Close photo viewer"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={dismiss}
                  style={[
                    styles.closeButton,
                    { top: insets.top + Spacing.one, right: Spacing.two },
                  ]}
                >
                  <Text style={styles.closeIcon}>×</Text>
                </Pressable>
                {children}
              </SafeAreaView>
            )}
            renderItem={(uri) => (
              <Image
                contentFit="contain"
                source={{ uri }}
                style={styles.image}
              />
            )}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.98)",
  },
  backdrop: { backgroundColor: "rgba(0, 0, 0, 0.98)" },
  closeButton: {
    zIndex: 20,
    position: "absolute",
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  closeIcon: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "600",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  image: {
    flex: 1,
    width: "100%",
  },
});

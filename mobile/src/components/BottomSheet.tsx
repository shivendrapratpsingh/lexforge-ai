import React from 'react';
import { Modal, View, Pressable, StyleSheet, Dimensions, DimensionValue } from 'react-native';
import { MotiView } from 'moti';
import { colors, radii } from '../theme/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Cap sheet height, e.g. '80%'. Defaults to auto (content-sized). */
  maxHeight?: DimensionValue;
};

/**
 * Bottom sheet used for: the "More" nav sheet, export-as menu, add-court-date-reminder form.
 * For a true drag-to-dismiss gesture, swap the backdrop Pressable + MotiView for
 * @gorhom/bottom-sheet — this version covers tap-to-dismiss + slide-up animation,
 * which is enough for most of this app's sheets.
 */
export default function BottomSheet({ visible, onClose, children, maxHeight }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <MotiView
        from={{ translateY: 400 }}
        animate={{ translateY: visible ? 0 : 400 }}
        transition={{ type: 'timing', duration: 220 }}
        style={[styles.sheet, maxHeight ? { maxHeight } : null]}
      >
        <View style={styles.grabber} />
        {children}
      </MotiView>
    </Modal>
  );
}

const { height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.modal,
    borderTopRightRadius: radii.modal,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: SCREEN_H * 0.85,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
});

import React, { createContext, useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { colors, fonts, fontSizes, radii } from '../theme/theme';

type ToastTone = 'default' | 'success' | 'danger';
type ToastItem = { id: number; message: string; tone: ToastTone };

type ToastContextValue = { show: (message: string, tone?: ToastTone) => void };
const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

/** Wrap your app (inside NavigationContainer) with <ToastProvider> once. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'default') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View pointerEvents="none" style={styles.host}>
        <AnimatePresence>
          {toasts.map((t) => (
            <MotiView
              key={t.id}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 12 }}
              style={[
                styles.toast,
                t.tone === 'success' && { borderColor: colors.success },
                t.tone === 'danger' && { borderColor: colors.danger },
              ]}
            >
              <Text style={styles.text}>{t.message}</Text>
            </MotiView>
          ))}
        </AnimatePresence>
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 100,
    alignItems: 'center',
    gap: 8,
  },
  toast: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
});

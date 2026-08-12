import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Screen container. Standard content inset from the designs: 76 / 32 / 40.
 *
 * `immersive` uses the deeper dark ground reserved for breathing and panic
 * sessions, where the world narrows to the orb.
 */
export function Screen({
  children,
  immersive = false,
  className = '',
}: { children: ReactNode; immersive?: boolean; className?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={`flex-1 ${immersive ? 'bg-immersive' : 'bg-background'} ${className}`}
      style={{
        // An immersive screen keeps only the safe area. Chrome-height padding
        // on a breathing session would push the orb off centre, and the orb
        // being centred is most of what makes the screen feel like somewhere
        // to rest rather than a page with something on it.
        paddingTop: immersive ? Math.max(insets.top, 20) : Math.max(insets.top, 20) + 56,
        paddingBottom: Math.max(insets.bottom, 16) + 24,
        paddingHorizontal: 32,
      }}
    >
      {children}
    </View>
  );
}

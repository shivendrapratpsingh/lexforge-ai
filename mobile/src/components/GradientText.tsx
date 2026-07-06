import React from 'react';
import { Text, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../theme/theme';

type Props = {
  children: string;
  style?: TextStyle | TextStyle[];
};

/**
 * Gold gradient text for hero/brand moments (e.g. "LexForge <GradientText>AI</GradientText>",
 * the Upgrade screen headline). Install: npm install @react-native-masked-view/masked-view
 */
export default function GradientText({ children, style }: Props) {
  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: 'transparent' }]}>{children}</Text>}>
      <LinearGradient
        colors={gradients.goldText}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

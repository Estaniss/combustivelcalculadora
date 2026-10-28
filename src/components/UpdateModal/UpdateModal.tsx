import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';

export interface UpdateModalProps {
  visible: boolean;
  /** Atualização obrigatória: não pode ser fechada. */
  required: boolean;
  latestVersion: string;
  message?: string;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateModal({
  visible,
  required,
  latestVersion,
  message,
  onUpdate,
  onDismiss,
}: UpdateModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      // No botão "voltar" do Android: fecha só se a atualização for opcional.
      onRequestClose={required ? undefined : onDismiss}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={required ? undefined : onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso de atualização"
          accessible={!required}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            theme.shadow.md,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xxl,
              padding: theme.spacing.xl,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            accessibilityRole="header"
            style={[theme.typography.title, { color: theme.colors.text, fontSize: 22 }]}
          >
            {required ? 'Atualização necessária' : 'Nova versão disponível'}
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
            ]}
          >
            {required
              ? `Para continuar usando o app, atualize para a versão ${latestVersion}.`
              : `A versão ${latestVersion} já está na Google Play.`}
          </Text>
          {message ? (
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.text, marginTop: theme.spacing.xs },
              ]}
            >
              {message}
            </Text>
          ) : null}

          <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.xs }}>
            <Button label="Atualizar agora" onPress={onUpdate} />
            {!required && <Button label="Agora não" variant="outline" onPress={onDismiss} />}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderWidth: 1,
  },
});

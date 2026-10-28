import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, fonts } from '@theme/index';
import { Header } from '@components/Header';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { EmptyState } from '@components/EmptyState';
import { useAnalyticsScreenView } from '@hooks/useAnalyticsScreenView';
import { comparisonRepository } from '../services/comparisonRepository';
import { ComparisonEntry } from '@/domain/comparison';
import { formatCurrency, formatDate, formatPercent } from '@utils/format';

const WINNER_LABEL: Record<ComparisonEntry['cheaperOption'], string> = {
  gasoline: 'Gasolina compensou mais',
  ethanol: 'Etanol compensou mais',
  tie: 'Empate',
};

export function ComparisonHistoryScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<ComparisonEntry[]>([]);
  useAnalyticsScreenView('ComparisonHistory');

  const load = useCallback(() => {
    comparisonRepository.getAll().then(setItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = async (id: string) => {
    await comparisonRepository.remove(id);
    load();
  };

  const handleClear = async () => {
    await comparisonRepository.clear();
    load();
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Header title="Últimas comparações" showBack />

      {items.length === 0 ? (
        <EmptyState
          illustration="drops"
          title="Nenhuma comparação ainda"
          description={'Cada comparação que você fizer em "Gasolina x Etanol" aparece aqui.'}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.xs }}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {formatDate(item.createdAt)}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Etanol a {formatPercent(item.priceRatio)} da gasolina
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.subtitle,
                  { color: theme.colors.primary, fontFamily: fonts.semibold, marginTop: 4 },
                ]}
              >
                {WINNER_LABEL[item.cheaperOption]}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.text, marginTop: 4 }]}>
                Gasolina {formatCurrency(item.gasolinePrice)} · Etanol{' '}
                {formatCurrency(item.ethanolPrice)}
              </Text>
              {item.cheaperOption !== 'tie' && (
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 4 },
                  ]}
                >
                  Economia de {formatCurrency(item.savingsPer100Km)} a cada 100 km
                </Text>
              )}
              <View style={{ marginTop: theme.spacing.xs }}>
                <Button label="Excluir" variant="outline" onPress={() => handleDelete(item.id)} />
              </View>
            </Card>
          )}
          ListFooterComponent={
            <View style={{ marginTop: theme.spacing.xs }}>
              <Button label="Limpar histórico" variant="outline" onPress={handleClear} />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

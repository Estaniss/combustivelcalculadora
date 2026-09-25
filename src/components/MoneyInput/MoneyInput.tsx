import React from 'react';
import { Input, InputProps } from '@components/Input';

export interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChangeText' | 'keyboard'> {
  /** Valor numérico em reais (ex: 6.2 para R$ 6,20). */
  value: number;
  /** Chamado com o valor numérico atualizado (não a string formatada). */
  onChangeValue: (value: number) => void;
}

function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function MoneyInput({ value, onChangeValue, ...inputProps }: MoneyInputProps) {
  const displayValue = formatCentsToBRL(Math.round(value * 100));

  const handleChangeText = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const cents = digitsOnly ? parseInt(digitsOnly, 10) : 0;
    onChangeValue(cents / 100);
  };

  return (
    <Input
      {...inputProps}
      keyboard="numeric"
      value={displayValue}
      onChangeText={handleChangeText}
    />
  );
}

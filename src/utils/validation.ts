import { formatNumber, parseLocaleNumber } from './format';

/** Limites de sanidade para evitar valores absurdos digitados sem querer. */
export const INPUT_LIMITS = {
  distanceKm: 20_000,
  consumptionKmPerLiter: 100,
  pricePerLiter: 50,
  liters: 500,
  odometerKm: 2_000_000,
  people: 50,
  tankLiters: 500,
} as const;

export type NumberValidation = { ok: true; value: number } | { ok: false; error: string };

export interface NumberRules {
  max?: number;
  /** Aceita zero (padrão: não aceita). */
  allowZero?: boolean;
  integer?: boolean;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Valida um campo numérico digitado e devolve ou o número, ou uma mensagem
 * de erro amigável em pt-BR. `label` vem com artigo: "a distância", "o consumo".
 */
export function validateNumber(
  raw: string,
  label: string,
  { max, allowZero = false, integer = false }: NumberRules = {},
): NumberValidation {
  const subject = capitalize(label);

  if (raw.trim() === '') return { ok: false, error: `Informe ${label}.` };

  const value = parseLocaleNumber(raw);
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return { ok: false, error: `${subject} deve conter apenas números.` };
  }
  if (value < 0) return { ok: false, error: `${subject} não pode ser negativo.` };
  if (value === 0 && !allowZero) {
    return { ok: false, error: `${subject} deve ser maior que zero.` };
  }
  if (integer && !Number.isInteger(value)) {
    return { ok: false, error: `${subject} deve ser um número inteiro.` };
  }
  if (max !== undefined && value > max) {
    return { ok: false, error: `${subject} parece alto demais (máximo ${formatNumber(max)}).` };
  }
  return { ok: true, value };
}

/**
 * Utilitários de formatação pt-BR — genéricos, reutilizáveis por qualquer
 * app da fábrica (não específicos deste app).
 *
 * Os formatadores Intl são criados uma única vez (criar Intl.NumberFormat a
 * cada render é caro) e reaproveitados.
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR');

const numberFormatters = new Map<number, Intl.NumberFormat>();

function getNumberFormatter(maximumFractionDigits: number): Intl.NumberFormat {
  let formatter = numberFormatters.get(maximumFractionDigits);
  if (!formatter) {
    formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits });
    numberFormatters.set(maximumFractionDigits, formatter);
  }
  return formatter;
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return currencyFormatter.format(0);
  return currencyFormatter.format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '0';
  return getNumberFormatter(maximumFractionDigits).format(value);
}

export function formatKm(value: number): string {
  return `${formatNumber(value)} km`;
}

export function formatKmPerLiter(value: number): string {
  return `${formatNumber(value)} km/L`;
}

export function formatPercent(ratio: number, maximumFractionDigits = 1): string {
  return `${formatNumber(ratio * 100, maximumFractionDigits)}%`;
}

/** 3725000 ms -> "01:02:05". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const pad = (value: number) => String(value).padStart(2, '0');
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(totalSeconds % 60)}`;
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

/**
 * Converte o texto digitado em número, aceitando os dois jeitos de escrever:
 *  - "37,5"       -> 37.5     (vírgula é sempre o decimal)
 *  - "1.250,50"   -> 1250.5   (pontos são milhar quando há vírgula)
 *  - "37.5"       -> 37.5     (ponto sozinho com 1-2 casas depois = decimal)
 *  - "1.250"      -> 1250     (ponto com exatamente 3 casas = milhar, padrão pt-BR)
 *  - "0.125"      -> 0.125    (parte inteira zero = decimal)
 * Retorna NaN para vazio ou texto que não é número (ex: "abc", "12a").
 */
export function parseLocaleNumber(value: string): number {
  const text = value.replace(/\s/g, '').replace(/^R\$/i, '');
  if (text === '' || !/^-?[\d.,]+$/.test(text)) return NaN;

  if (text.includes(',')) {
    return Number(text.replace(/\./g, '').replace(',', '.'));
  }

  const dotCount = text.split('.').length - 1;
  if (dotCount === 0) return Number(text);
  if (dotCount > 1) return Number(text.replace(/\./g, ''));

  const [integerPart = '', decimalPart = ''] = text.split('.');
  const looksLikeThousands =
    decimalPart.length === 3 && integerPart !== '' && integerPart.replace('-', '') !== '0';
  return looksLikeThousands ? Number(`${integerPart}${decimalPart}`) : Number(text);
}

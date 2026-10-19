/** Posto de combustível, independente de qual API fornece os dados. */
export interface Station {
  id: string;
  name: string;
  address?: string;
  /** Bandeira (Shell, Ipiranga…), quando a fonte informa. */
  brand?: string;
  latitude: number;
  longitude: number;
  /** Nota média (0–5), quando a fonte informa. */
  rating?: number;
  ratingCount?: number;
  /** true = aberto, false = fechado, undefined = a fonte não informou. */
  openNow?: boolean;
}

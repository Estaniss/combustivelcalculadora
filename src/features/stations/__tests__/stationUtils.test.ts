import { Station } from '@/domain/station';
import {
  buildDirectionsLinks,
  formatDistance,
  openStatusLabel,
  sortByDistance,
} from '../services/stationUtils';

const origin = { latitude: -23.55, longitude: -46.63 };
const station = (id: string, latitude: number): Station => ({
  id,
  name: id,
  latitude,
  longitude: -46.63,
});

describe('sortByDistance', () => {
  it('ordena do mais perto para o mais longe e informa a distância', () => {
    const result = sortByDistance(
      [station('longe', -23.6), station('perto', -23.551), station('meio', -23.56)],
      origin,
    );
    expect(result.map((s) => s.id)).toEqual(['perto', 'meio', 'longe']);
    expect(result[0]?.distanceMeters).toBeCloseTo(111.19, 0);
  });

  it('não altera a lista original', () => {
    const list = [station('b', -23.6), station('a', -23.551)];
    sortByDistance(list, origin);
    expect(list.map((s) => s.id)).toEqual(['b', 'a']);
  });
});

describe('formatDistance', () => {
  it.each([
    [0, '0 m'],
    [450, '450 m'],
    [999.4, '999 m'],
    [1250, '1,3 km'],
    [12_000, '12 km'],
  ])('%d m -> %s', (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected);
  });

  it('devolve traço para valor inválido', () => {
    expect(formatDistance(NaN)).toBe('—');
    expect(formatDistance(-5)).toBe('—');
  });
});

describe('openStatusLabel', () => {
  it('não afirma "fechado" quando a fonte não informa', () => {
    expect(openStatusLabel(true)).toBe('Aberto agora');
    expect(openStatusLabel(false)).toBe('Fechado agora');
    expect(openStatusLabel(undefined)).toBe('Horário não informado');
  });
});

describe('buildDirectionsLinks', () => {
  it('monta os links de rota de carro com lat,lng', () => {
    const links = buildDirectionsLinks({ latitude: -23.5505, longitude: -46.6333 });
    expect(links.googleMaps).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-23.5505,-46.6333&travelmode=driving',
    );
    expect(links.waze).toBe('https://waze.com/ul?ll=-23.5505,-46.6333&navigate=yes');
    expect(links.appleMaps).toBe('https://maps.apple.com/?daddr=-23.5505,-46.6333&dirflg=d');
  });
});

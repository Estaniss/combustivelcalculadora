import AsyncStorage from '@react-native-async-storage/async-storage';
import { refuelingRepository } from '../services/refuelingRepository';
import { NewRefuelingInput } from '@/domain/refueling';

const input = (vehicleId: string, odometer: number): NewRefuelingInput => ({
  vehicleId,
  date: '2026-01-01T12:00:00.000Z',
  odometer,
  liters: 40,
  pricePerLiter: 6,
  fuelType: 'gasoline',
  fullTank: true,
});

describe('refuelingRepository.removeByVehicle', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('remove só os abastecimentos do veículo e devolve quantos foram', async () => {
    await refuelingRepository.create(input('a', 1000));
    await refuelingRepository.create(input('a', 1500));
    await refuelingRepository.create(input('b', 2000));

    const removed = await refuelingRepository.removeByVehicle('a');

    expect(removed).toBe(2);
    const left = await refuelingRepository.getAll();
    expect(left).toHaveLength(1);
    expect(left[0]?.vehicleId).toBe('b');
  });

  it('veículo sem abastecimentos: devolve 0 e não mexe em nada', async () => {
    await refuelingRepository.create(input('b', 2000));
    expect(await refuelingRepository.removeByVehicle('zzz')).toBe(0);
    expect(await refuelingRepository.getAll()).toHaveLength(1);
  });

  it('funciona com o armazenamento vazio', async () => {
    expect(await refuelingRepository.removeByVehicle('a')).toBe(0);
  });
});

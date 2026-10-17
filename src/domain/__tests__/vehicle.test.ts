import { getVehicleConsumption, Vehicle } from '../vehicle';

function makeVehicle(overrides: Partial<Vehicle>): Vehicle {
  return {
    id: '1',
    name: 'Carro',
    fuelType: 'flex',
    icon: '🚗',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('getVehicleConsumption', () => {
  it('usa o consumo específico de cada combustível', () => {
    const vehicle = makeVehicle({ gasolineConsumption: 12, ethanolConsumption: 8.5 });
    expect(getVehicleConsumption(vehicle, 'gasoline')).toBe(12);
    expect(getVehicleConsumption(vehicle, 'ethanol')).toBe(8.5);
  });

  it('flex com só a média: usa na gasolina, mas NÃO inventa o do etanol', () => {
    const vehicle = makeVehicle({ averageConsumption: 11 });
    expect(getVehicleConsumption(vehicle, 'gasoline')).toBe(11);
    expect(getVehicleConsumption(vehicle, 'ethanol')).toBeUndefined();
  });

  it('veículo só a etanol usa a média no etanol', () => {
    const vehicle = makeVehicle({ fuelType: 'ethanol', averageConsumption: 9 });
    expect(getVehicleConsumption(vehicle, 'ethanol')).toBe(9);
    expect(getVehicleConsumption(vehicle, 'gasoline')).toBeUndefined();
  });

  it('diesel não tem consumo de gasolina/etanol', () => {
    const vehicle = makeVehicle({ fuelType: 'diesel', averageConsumption: 10 });
    expect(getVehicleConsumption(vehicle, 'gasoline')).toBeUndefined();
    expect(getVehicleConsumption(vehicle, 'ethanol')).toBeUndefined();
  });
});

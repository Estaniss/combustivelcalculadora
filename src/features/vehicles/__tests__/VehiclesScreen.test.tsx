import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@theme/index';
import { Vehicle } from '@/domain/vehicle';
import { VehiclesScreen, vehicleChips } from '../screens/VehiclesScreen';
import { vehicleRepository } from '../services/vehicleRepository';
import { refuelingRepository } from '@features/refueling/services/refuelingRepository';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
    useFocusEffect: (callback: () => void) => React.useEffect(callback, []),
  };
});
jest.mock('../services/vehicleRepository');
jest.mock('@features/refueling/services/refuelingRepository');

const base = {
  icon: 'car' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const civic: Vehicle = {
  ...base,
  id: 'v1',
  name: 'Meu Civic',
  brand: 'Honda',
  model: 'Civic',
  year: 2020,
  fuelType: 'flex',
  gasolineConsumption: 12,
  ethanolConsumption: 8.5,
  tankCapacityLiters: 50,
};
const moto: Vehicle = {
  ...base,
  id: 'v2',
  name: 'Minha Moto',
  icon: 'moto',
  fuelType: 'gasoline',
  averageConsumption: 35,
};

const repo = vehicleRepository as jest.Mocked<typeof vehicleRepository>;
const refuelings = refuelingRepository as jest.Mocked<typeof refuelingRepository>;

function setup(vehicles: Vehicle[], selected: Vehicle | null) {
  repo.getAll.mockResolvedValue(vehicles);
  repo.getSelected.mockResolvedValue(selected);
  return render(
    <ThemeProvider>
      <VehiclesScreen />
    </ThemeProvider>,
  );
}

describe('vehicleChips', () => {
  it('mostra consumo por combustível e tanque', () => {
    expect(vehicleChips(civic)).toEqual(['Gasolina 12 km/L', 'Etanol 8,5 km/L', 'Tanque 50 L']);
  });
  it('sem consumo específico, usa o consumo médio', () => {
    expect(vehicleChips(moto)).toEqual(['Consumo 35 km/L']);
  });
  it('sem dados, não inventa chips', () => {
    expect(vehicleChips({ ...base, id: 'x', name: 'x', fuelType: 'diesel' })).toEqual([]);
  });
});

describe('VehiclesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    repo.selectVehicle.mockResolvedValue();
    repo.remove.mockResolvedValue();
    refuelings.removeByVehicle.mockResolvedValue(3);
  });

  it('lista os carros, marca o principal e mostra os chips', async () => {
    setup([civic, moto], civic);
    expect(await screen.findByText('Meu Civic')).toBeTruthy();
    expect(screen.getByText('Minha Moto')).toBeTruthy();
    expect(screen.getByText('Principal')).toBeTruthy();
    expect(screen.getByText('Etanol 8,5 km/L')).toBeTruthy();
    expect(screen.getByText('Honda Civic 2020')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Meu Civic, carro principal' })).toBeTruthy();
  });

  it('tocar em outro carro o torna o principal', async () => {
    setup([civic, moto], civic);
    fireEvent.press(await screen.findByRole('button', { name: 'Minha Moto' }));
    await waitFor(() => expect(repo.selectVehicle).toHaveBeenCalledWith('v2'));
  });

  it('tocar no carro que já é o principal não faz nada', async () => {
    setup([civic], civic);
    fireEvent.press(await screen.findByRole('button', { name: 'Meu Civic, carro principal' }));
    expect(repo.selectVehicle).not.toHaveBeenCalled();
  });

  it('Excluir pede confirmação antes de apagar qualquer coisa', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    setup([civic], civic);
    fireEvent.press((await screen.findAllByRole('button', { name: 'Excluir' }))[0] as never);

    expect(alert).toHaveBeenCalledTimes(1);
    const [title, message] = alert.mock.calls[0] as [string, string];
    expect(title).toBe('Excluir Meu Civic?');
    expect(message).toContain('abastecimentos');
    expect(repo.remove).not.toHaveBeenCalled();
    expect(refuelings.removeByVehicle).not.toHaveBeenCalled();
  });

  it('confirmar apaga os abastecimentos ANTES do carro', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    setup([civic], civic);
    fireEvent.press((await screen.findAllByRole('button', { name: 'Excluir' }))[0] as never);

    const buttons = (alert.mock.calls[0] as unknown[])[2] as {
      text: string;
      onPress?: () => Promise<void>;
    }[];
    const confirm = buttons.find((b) => b.text === 'Excluir');
    await confirm?.onPress?.();

    const order = [
      refuelings.removeByVehicle.mock.invocationCallOrder[0],
      repo.remove.mock.invocationCallOrder[0],
    ] as [number, number];
    expect(refuelings.removeByVehicle).toHaveBeenCalledWith('v1');
    expect(repo.remove).toHaveBeenCalledWith('v1');
    expect(order[0]).toBeLessThan(order[1]);
  });

  it('cancelar não apaga nada', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    setup([civic], civic);
    fireEvent.press((await screen.findAllByRole('button', { name: 'Excluir' }))[0] as never);
    const buttons = (alert.mock.calls[0] as unknown[])[2] as { text: string; style?: string }[];
    expect(buttons.find((b) => b.style === 'cancel')?.text).toBe('Cancelar');
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('Editar abre o formulário com o id do carro', async () => {
    setup([civic], civic);
    fireEvent.press((await screen.findAllByRole('button', { name: 'Editar' }))[0] as never);
    expect(mockNavigate).toHaveBeenCalledWith('VehicleForm', { vehicleId: 'v1' });
  });

  it('sem carros mostra o estado vazio com o botão de adicionar', async () => {
    setup([], null);
    expect(await screen.findByText('Cadastre seu primeiro carro')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Adicionar carro' }));
    expect(mockNavigate).toHaveBeenCalledWith('VehicleForm', {});
  });
});

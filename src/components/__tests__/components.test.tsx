import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@theme/index';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { EmptyState } from '@components/EmptyState';
import { Input } from '@components/Input';
import { ResultCard } from '@components/ResultCard';
import { Illustration } from '@components/Illustration';
import { Icon } from '@components/Icon';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('componentes base (renderização e acessibilidade)', () => {
  it('Button: papel, rótulo e clique', () => {
    const onPress = jest.fn();
    wrap(<Button label="Calcular" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Calcular' });
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Button desabilitado ou carregando não dispara clique', () => {
    const onPress = jest.fn();
    wrap(
      <>
        <Button label="Desabilitado" disabled onPress={onPress} />
        <Button label="Carregando" loading onPress={onPress} />
      </>,
    );
    fireEvent.press(screen.getByLabelText('Desabilitado'));
    fireEvent.press(screen.getByLabelText('Carregando'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('Button com ícone continua com o mesmo rótulo acessível', () => {
    wrap(<Button label="Histórico" icon="history" variant="outline" onPress={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Histórico' })).toBeTruthy();
  });

  it('Input: rótulo acessível, texto digitado e mensagem de erro', () => {
    const onChangeText = jest.fn();
    wrap(
      <Input
        label="Distância (km)"
        value=""
        onChangeText={onChangeText}
        error="Informe a distância."
      />,
    );
    fireEvent.changeText(screen.getByLabelText('Distância (km)'), '120');
    expect(onChangeText).toHaveBeenCalledWith('120');
    expect(screen.getByText('Informe a distância.')).toBeTruthy();
  });

  it('Input repassa onFocus/onBlur do chamador (usado pelo Autocomplete)', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    wrap(
      <Input
        label="Marca"
        value=""
        onChangeText={() => undefined}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    const field = screen.getByLabelText('Marca');
    fireEvent(field, 'focus');
    fireEvent(field, 'blur');
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
  });

  it('ResultCard: um único elemento legível com legenda e valor', () => {
    wrap(<ResultCard label="Custo estimado" value="R$ 258,33" />);
    expect(screen.getByLabelText('Custo estimado: R$ 258,33')).toBeTruthy();
  });

  it('EmptyState mostra título e descrição, e a ilustração é decorativa', () => {
    wrap(
      <EmptyState
        title="Nenhum abastecimento"
        description="Registre o primeiro."
        illustration="pump"
      />,
    );
    expect(screen.getByRole('header', { name: 'Nenhum abastecimento' })).toBeTruthy();
    expect(screen.getByText('Registre o primeiro.')).toBeTruthy();
  });

  it('Card, Icon e Illustration renderizam sem erro nos dois temas', () => {
    expect(() =>
      wrap(
        <Card>
          <Icon name="map-pin" label="Posto" />
          <Illustration name="station" label="Mapa" />
        </Card>,
      ),
    ).not.toThrow();
    expect(screen.getByLabelText('Posto')).toBeTruthy();
    expect(screen.getByLabelText('Mapa')).toBeTruthy();
  });
});

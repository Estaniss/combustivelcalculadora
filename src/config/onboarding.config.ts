/**
 * Conteúdo do onboarding. GENÉRICO — parte do template. Cada app define
 * seus próprios slides aqui (2-3, no máximo), mantendo o componente de
 * onboarding em si (screens/Onboarding) reutilizável.
 */
export interface OnboardingSlide {
  emoji: string;
  title: string;
  description: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    emoji: '🚗',
    title: 'Controle seu combustível',
    description: 'Acompanhe consumo e gastos do seu carro.',
  },
  {
    emoji: '⛽',
    title: 'Descubra o combustível mais econômico',
    description: 'Compare gasolina e etanol usando seu consumo real.',
  },
  {
    emoji: '📊',
    title: 'Acompanhe seus gastos',
    description: 'Veja quanto você está gastando com combustível.',
  },
];

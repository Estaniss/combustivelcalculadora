/**
 * Conteúdo do onboarding. GENÉRICO — parte do template. Cada app define
 * seus próprios slides aqui (2-3, no máximo), mantendo o componente de
 * onboarding em si (screens/Onboarding) reutilizável.
 */
import type { IllustrationName } from '@components/Illustration/illustrations';

export interface OnboardingSlide {
  illustration: IllustrationName;
  title: string;
  description: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    illustration: 'pump',
    title: 'Controle seu combustível',
    description: 'Acompanhe consumo e gastos do seu carro.',
  },
  {
    illustration: 'drops',
    title: 'Descubra o combustível mais econômico',
    description: 'Compare gasolina e etanol usando seu consumo real.',
  },
  {
    illustration: 'gauge',
    title: 'Acompanhe seus gastos',
    description: 'Veja quanto você está gastando com combustível.',
  },
];

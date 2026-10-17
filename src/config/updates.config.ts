/**
 * Configuração da verificação de atualização.
 *
 * O app baixa um pequeno JSON (version.json, na raiz do repositório) e
 * compara com a versão instalada. Para cada app novo da fábrica, só trocar
 * a URL abaixo.
 *
 * FLUXO DE RELEASE: publique a nova versão na Play Store PRIMEIRO e só depois
 * atualize o version.json — senão os usuários veem "atualização disponível"
 * antes de ela estar na loja.
 */
export const updatesConfig = {
  enabled: true,
  manifestUrl:
    'https://raw.githubusercontent.com/Estaniss/combustivelcalculadora/main/version.json',
  timeoutMs: 6000,
} as const;

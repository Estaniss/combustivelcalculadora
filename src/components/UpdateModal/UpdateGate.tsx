import React from 'react';
import { useUpdateCheck } from '@hooks/useUpdateCheck';
import { UpdateModal } from './UpdateModal';

/** Coloque uma vez na raiz do app: checa a versão e mostra o aviso se precisar. */
export function UpdateGate() {
  const { prompt, accept, dismiss } = useUpdateCheck();
  if (!prompt) return null;

  return (
    <UpdateModal
      visible
      required={prompt.required}
      latestVersion={prompt.latestVersion}
      message={prompt.message}
      onUpdate={accept}
      onDismiss={dismiss}
    />
  );
}

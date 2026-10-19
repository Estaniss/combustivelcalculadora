# Publicar o Modo Viagem e o mapa de postos (Google Play)

O app passa a usar localização. Isso muda três coisas na Play antes de publicar:
a **declaração de serviço em primeiro plano**, a **Segurança dos dados** e os **textos** (loja e política).
Os nomes dos menus podem variar um pouco no Play Console — confira na tela.

## O que o app declara no Android
Permissões: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `FOREGROUND_SERVICE`,
`FOREGROUND_SERVICE_LOCATION`. **Não** usa `ACCESS_BACKGROUND_LOCATION`: o rastreio com a tela
bloqueada roda como serviço em primeiro plano, com notificação fixa, iniciado pelo usuário com o app aberto.

## 1) Declaração de serviço em primeiro plano (Conteúdo do app)
- Tipo: **Localização**.
- Descrição (sugestão): *"O usuário inicia e encerra manualmente o Modo Viagem. Enquanto ele está ativo, o app mede a distância percorrida pelo GPS, mesmo com a tela bloqueada, e mostra uma notificação fixa. A distância total é usada para calcular o custo de combustível da viagem. O rastreio para quando o usuário finaliza ou cancela."*
- A Play pede um **link de vídeo** mostrando o recurso. Roteiro de gravação (≈1 min):
  1. Abrir o app → Modo Viagem → preencher preços → **Iniciar viagem**.
  2. Mostrar a explicação, aceitar, aceitar a permissão do sistema.
  3. Mostrar a notificação fixa na barra de status.
  4. Bloquear a tela, andar um pouco, desbloquear: a distância aumentou.
  5. **Finalizar viagem** → mostrar o resumo.

## 2) Segurança dos dados
Mantenha o que já está declarado (ID de publicidade, falhas, diagnósticos). Acrescente:
- **Localização** (aproximada e precisa) — *coletada*, finalidade **funcionalidade do app**, opcional,
  criptografada em trânsito (HTTPS). Motivo: o mapa envia a posição ao servidor Overpass (OpenStreetMap) para achar postos.
- Na dúvida, declare: é mais seguro que ser notificado depois.
- A distância medida no Modo Viagem fica **só no aparelho** — não é dado "coletado".

## 3) Textos
**Política de Privacidade** — acrescentar: o app usa a localização (a) durante o Modo Viagem, para medir
distância, sem enviar nem guardar o trajeto; (b) na tela de postos, enviando a posição aproximada ao
serviço Overpass/OpenStreetMap para listar postos próximos. O mapa carrega tiles do OpenStreetMap e a
biblioteca Leaflet (unpkg), o que expõe o IP do aparelho a esses serviços.

**Descrição na loja** — remover afirmações como "nenhum dado pessoal é coletado" e "sem servidor".
Sugestão: *"Sua localização só é usada quando você inicia o Modo Viagem ou abre o mapa de postos. O
trajeto não é guardado."*

## 4) Antes de enviar a versão
- `npx expo install expo-location expo-task-manager react-native-webview` e commitar o `package-lock.json`.
- Gerar novo build nativo (muda o AndroidManifest). Não funciona no Expo Go.
- Testar num aparelho real: viagem com a tela bloqueada; fechar o app no meio e reabrir; sem sinal de GPS.
- Em Xiaomi/Samsung/Motorola a economia de bateria pode matar o serviço: oriente "Sem restrições" nas
  configurações de bateria do app. O app avisa "GPS sem sinal" e permite retomar o rastreio.

## Limites conhecidos
- **Nota/avaliação do posto não existe** no OpenStreetMap (só no Google Places). A tela mostra distância e aberto/fechado.
- **Aberto/fechado** vem da tag `opening_hours` e só é calculado nos formatos comuns; senão aparece "Horário não informado".
- **Tiles do OSM**: o servidor público não é para uso pesado. Antes de crescer, troque `tileUrl` em `src/config/map.config.ts` por um provedor com cota.
- **Overpass**: instâncias públicas têm limite de uso; há cache de 10 min e fallback entre duas instâncias.
- Android 13+: sem permissão de notificação, o serviço roda, mas a notificação não aparece na barra.

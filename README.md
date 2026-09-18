# Combustível — Calculadora e Controle (App #001 da Fábrica)

Aplicativo Android que ajuda motoristas a calcular gastos de viagem, comparar
gasolina x etanol, acompanhar consumo e controlar abastecimentos. Funciona
**100% offline** (exceto anúncios) — sem conta, sem login, sem backend.

Construído sobre o [template da fábrica de apps utilitários](../app-template),
reaproveitando toda a infraestrutura genérica (tema, componentes, ads,
analytics, storage, navegação) e implementando apenas o que é específico
deste produto.

---

## TEMPLATE x APP ESPECÍFICO

| Camada | Origem |
|---|---|
| `theme/`, `components/`, `navigation/` (mecanismo) | **Template** — inalterado |
| `services/ads`, `services/analytics`, `services/storage` (mecanismo) | **Template** — inalterado |
| `screens/Settings` (avaliar/compartilhar reais), `screens/Onboarding` (mecanismo) | **Template** — melhorado nesta rodada, reaproveitável por outros apps |
| `utils/format.ts` (pt-BR/BRL) | **Template** — novo, genérico |
| `config/onboarding.config.ts`, `app.config.ts` (conteúdo) | **App específico** — conteúdo textual/visual deste app |
| `domain/` (`Vehicle`, `Refueling`) | **App específico** |
| `features/vehicles`, `refueling`, `trip-calculator`, `fuel-comparison`, `consumption`, `statistics` | **App específico** |
| Chaves `VEHICLES`, `REFUELINGS`, `SELECTED_VEHICLE_ID` em `storageService.ts` | **App específico** (adicionadas ao arquivo genérico do template) |

---

## Stack

Igual ao template: Expo SDK 51, React Native 0.74, TypeScript strict,
React Navigation, AsyncStorage, react-native-google-mobile-ads,
Firebase Analytics/Crashlytics, Jest.

## Instalação e execução

```bash
npm install
npm start           # Metro
npm run android      # build local (expo run:android)
```

Como o app usa AdMob e Firebase (módulos nativos), **não funciona no Expo Go**
— é preciso rodar em um development build (`expo run:android` ou
`eas build --profile development`).

## Desenvolvimento rápido no Expo Go (sem dev client)

Por padrão, `enableAds` e `enableAnalytics` estão **desligados** em
`app.config.ts` para permitir rodar o app direto no **Expo Go**
(`npm start` + escanear o QR code), sem precisar de development build.
Isso é ótimo para iterar rápido nas telas e na lógica de negócio.

Quando for testar anúncios/analytics de verdade, religue as duas flags e
rode via development build (`npm run android`). **Atenção**: na versão
atual do `react-native-google-mobile-ads` (14.x) usada neste projeto, o
build nativo falha com o erro `Too many arguments for public constructor
ViewGroupManager<T>()` — essa versão da lib exige a **New Architecture**
do React Native, que este projeto ainda não tem habilitada. Duas opções:
1. Fixar `react-native-google-mobile-ads` numa versão anterior compatível
   com a old architecture (ex: `^13.0.5`) no `package.json` e rodar
   `npm install` de novo; ou
2. Habilitar a New Architecture (`"newArchEnabled": true` em `app.json`) —
   mais trabalhoso, pois outras libs do projeto também precisam suportar.
A opção 1 é a mais simples para desbloquear rápido.

## AdMob

IDs de teste são usados automaticamente fora do ambiente `production` (ver
`src/config/ads.config.ts`). Para produção, preencha `.env` com os IDs reais
deste app específico (diferentes dos IDs de outros apps da fábrica) e
atualize `android.config.googleMobileAdsAppId` em `app.json`.

## Firebase (Analytics/Crashlytics)

Este app usa o Firebase de verdade (diferente do template genérico, que deixa
isso opcional). Passos:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. Adicione um app Android com o package `com.seudominio.combustivelcalculadora`
   (ou o package que você definir em `app.json`).
3. Baixe o `google-services.json` e coloque na raiz do projeto.
4. Adicione em `app.json`, dentro de `expo.android`:
   ```json
   "googleServicesFile": "./google-services.json"
   ```

## Armazenamento local

Todos os dados (`Vehicle`, `Refueling`, veículo selecionado) ficam no
dispositivo via `storageService` (AsyncStorage). Nenhum dado sai do
aparelho, exceto o necessário para anúncios/analytics (sem informações
pessoais — nome, placa ou documentos nunca são coletados).

## Testes

```bash
npm test              # 26 testes das regras de negócio
npm run typecheck      # 0 erros
npm run lint            # 0 erros
```

Cobertura das regras principais: cálculo de viagem (ida/volta, divisão por
pessoas), comparação gasolina x etanol (por preço **e** consumo reais),
consumo médio (com validação de odômetro), estatísticas mensais.

## Estrutura

```
src/
├── domain/                 # Vehicle, Refueling (tipos)
├── features/
│   ├── vehicles/            # cadastro/seleção de veículos
│   ├── refueling/           # registro + histórico de abastecimentos
│   ├── trip-calculator/     # "Quanto vou gastar?" + dividir viagem
│   ├── fuel-comparison/     # Gasolina x Etanol
│   ├── consumption/         # "Meu consumo"
│   └── statistics/          # estatísticas do mês
├── screens/                # Home, About, Settings, Onboarding (shell do app)
├── components/, theme/, services/, navigation/, config/  # do template
```

## Build e publicação

```bash
npm run build:preview      # APK de teste
npm run build:production    # AAB para a Play Store
```

Antes de publicar, revise o checklist do template (`../app-template/README.md`)
e preencha: ícone/splash definitivos (os atuais são placeholders gerados
automaticamente), package name, versionCode, descrição da loja.

## ASO — sugestão inicial

- **Nome:** Combustível: Gasolina e Etanol
- **Palavras-chave:** calculadora combustível, gasolina ou etanol, cálculo
  combustível, consumo carro, gasto combustível, custo viagem, km por litro,
  controle abastecimento
- **Proposta de valor:** "Descubra se vale mais gasolina ou etanol com o SEU
  consumo real, calcule o gasto de qualquer viagem e controle seus
  abastecimentos — tudo offline, sem cadastro."

## Como criar o App #002

Veja a seção "Como transformar este template em um NOVO aplicativo" no
README do template (`../app-template/README.md`). O processo é o mesmo:
duplicar o template, criar `features/<nova-feature>` seguindo o padrão
`services/` (lógica pura) + `screens/`, e trocar `app.config.ts`.

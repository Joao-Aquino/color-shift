---
name: Contrast card Figma
overview: Atualizar o cartão de contraste (tabs, score e thresholds abertos) para bater com o frame Figma 3359:1577, sem mudar os valores de threshold nem o comportamento de seleção vs. mais próximo.
todos:
  - id: tokens
    content: Add score 300/400/500/1000 tokens in globals.css
    status: completed
  - id: score-layout
    content: Restyle tabs, score metrics, radii, and open spacing in score.tsx
    status: completed
  - id: pills
    content: Restyle ThresholdButtons as score-tinted pills with separate selected vs nearest states
    status: completed
isProject: false
---

# Contrast card — match Figma 3359:1577

O nó é o component set **Contrast Result** (Good / Meh / Bad × WCAG / APCA × fechado / aberto). O app já tem a estrutura certa em [`components/control-bar/score.tsx`](components/control-bar/score.tsx) e [`components/control-bar/threshold-buttons.tsx`](components/control-bar/threshold-buttons.tsx). O que falta é o visual novo, sobretudo a faixa aberta.

Medidas do variant aberto WCAG Good (`3376:2882`): tabs 34px; corpo do score com inset 24px; número com caixa aparada de 40px; 16px até o divisor; 16px até os pills de 32px; 24px embaixo. Fechado (`3359:1578`): 32px abaixo do número (corpo 104px).

## O que muda

**Tokens** em [`app/globals.css`](app/globals.css). Os fundos 200 e os labels 900 já existem. Acrescentar, por tom (good / meh / bad):

- borda 300 — `#12361b` / `#4d2a00` / `#561a1e`
- fill do pill ativo 400 — `#0c451b` / `#573300` / `#671e21`
- borda do pill ativo 500 — `#126426` / `#6b4105` / `#832126`
- texto claro 1000 — `#e5fbea` / `#fef3dc` / `#feecee`

**Tabs** ([`score.tsx`](components/control-bar/score.tsx)): texto e ícone do tab ativo usam o 1000 do tom (hoje é branco / label 900). Inativo continua `#ededed` no rótulo. Altura natural `py-2` (~34px), sem `h-9`.

**Score:** tirar o `h-[102px]` fixo e o wrapper `overflow-hidden rounded-[4px]`, que corta o raio de 12px das tabs e o de 16px do corpo. Número em Geist Mono 56px, tracking `-2.24px`, com `text-box-trim: trim-both` e `text-box-edge: cap alphabetic` para a caixa de 40px. Grade / `Lc` em 11px / leading 11px, cor 900. Padding: `px-6 pt-8`; `pb-8` fechado e `pb-4` aberto (a transição de padding usa os mesmos 200ms / 150ms do accordion).

**Thresholds abertos:** o divisor deixa de ser `border-t border-white/10` full-bleed. Fica uma linha de 1px na cor 300, inset 24px, dentro do accordion. Abaixo, `mt-4`, pills, `pb-6`.

Pills em [`threshold-buttons.tsx`](components/control-bar/threshold-buttons.tsx):

- `h-8 rounded-full`, Geist Mono 12px, tracking `-0.48px`, `gap-1`
- inativo: borda 300, texto 1000, fundo transparente
- selecionado: fundo 400, borda 500, texto 900
- mais próximo: ponto de 4px, 4px acima da base (já existe; continua independente do selecionado)

Quando os dois coincidem, o resultado é o mock (pill preenchido + ponto). Valores continuam os do produto em [`lib/color/contrast.ts`](lib/color/contrast.ts): WCAG `1.5 / 3.0 / 4.5 / 7.0`, APCA `30 / 45 / 60 / 75`. Os `30 / 40 / 50 / 60` do Figma são rótulo do componente, não a escala do app ([`specs-context/style-guide-color-shift.md`](specs-context/style-guide-color-shift.md)).

Accordion, odometer, a11y e a descrição abaixo do cartão ficam como estão.

## Verificação

No browser: trocar WCAG/APCA, ver Good / Meh / Bad, abrir e fechar a faixa, clicar um threshold diferente do ponto mais próximo, e confirmar que o canto inferior fica em 16px (não cortado em 4px).
---
name: Motion audit fixes
overview: "Corrigir os três achados do audit improve-animations: odometer curto (200ms), IconButton sem transition-all + press scale(0.97), e expand do score com accordion CSS no padrão do ColorField."
todos:
  - id: odometer-duration
    content: "lib/odometer.ts: duration 0.22, stagger 0.02, revealDuration 0.2"
    status: completed
  - id: icon-button-press
    content: "IconButton: transition nomeada + active scale(0.97) 160ms ease-out"
    status: completed
  - id: score-accordion
    content: "Score thresholds: grid 0fr/1fr + opacity + exit cache (padrão ColorField)"
    status: completed
  - id: plans-docs
    content: Registrar 002–004 em plans/ e atualizar README
    status: completed
isProject: false
---

# Motion audit — três correções

Escopo: só o que o audit marcou como acionável agora. Phase 7 (GSAP Flip, TubeText, photo crossfade, DialKit) fica de fora.

Valores (AUDIT.md): open **200ms** / close **150ms**, ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; press `scale(0.97)` **160ms** ease-out; UI &lt; 300ms.

Também registrar em [`plans/`](plans/) como `002`–`004` + atualizar [`plans/README.md`](plans/README.md) (continuidade do improve-animations).

---

## 1. Odometer — duração no teto de UI

**Arquivo:** [`lib/odometer.ts`](lib/odometer.ts)

Hoje:

```ts
const defaults = {
  duration: 1,           // 1s — lento demais sob drag
  ease: "power3.out",
  digitStagger: 0.04,
  revealDuration: 0.5,
  ...
};
```

**Alvo:**
- `duration: 0.22` (220ms)
- `digitStagger: 0.02` (stagger proporcional; 4 dígitos ≈ +60ms no último)
- `revealDuration: 0.2` (alinha com open 200ms)
- Manter `ease: "power3.out"`, kill/retarget e `prefers-reduced-motion` (já ok)
- Não mudar a API de [`odometer.tsx`](components/control-bar/odometer.tsx)

**Feel check:** arrastar um slider — o score acompanha sem rolar ~1s; Esc/nav foto ainda tem roll curto e legível.

---

## 2. IconButton — transition nomeada + press

**Arquivo:** [`components/control-bar/icon-button.tsx`](components/control-bar/icon-button.tsx)
**Não tocar** [`components/ui/button.tsx`](components/ui/button.tsx) (shadcn compartilhado).

Hoje a action row herda `transition-all` e `active:translate-y-px` do Button base.

**Alvo** (classes no `IconButton`, sobrescrevendo o base):

```
transition-[border-color,background-color,opacity,transform]
duration-160
ease-[cubic-bezier(0.23,1,0.32,1)]
active:scale-[0.97]
active:translate-y-0
motion-safe: only on transform (Tailwind motion-safe:active:scale-[0.97] se disponível; senão media no mesmo espírito do ColorField)
```

Manter borda/hover/disabled atuais. Tooltip inalterado.

**Feel check:** press na action row é squash sutil, sem translate-y; hover de borda/fundo ainda suave.

---

## 3. Score thresholds — accordion CSS (interim até Phase 7 Flip)

**Arquivo:** [`components/control-bar/score.tsx`](components/control-bar/score.tsx)

Hoje corte seco:

```tsx
{expanded && score ? (
  <div id="contrast-thresholds">
    <ThresholdButtons ... />
  </div>
) : null}
```

**Alvo:** mesmo padrão de [`color-fields.tsx`](components/control-bar/color-fields.tsx):
- Wrapper sempre no DOM com `id="contrast-thresholds"`
- `grid-rows-[0fr]` / `grid-rows-[1fr]` + `overflow-hidden` no filho
- Opacity 0→1 no conteúdo
- Open **200ms** / close **150ms**, `ease-[cubic-bezier(0.23,1,0.32,1)]`, prefixo `motion-safe:`
- Manter `ThresholdButtons` montado enquanto `expanded || rendered` (cache no close via `transitionend` em `grid-template-rows`), para a altura colapsar de verdade
- Reduced motion: unmount imediato no close (como ColorField)
- `aria-expanded` / `aria-controls` no botão do score já existem — não mudar o contrato a11y

Não implementar GSAP Flip (Phase 7).

**Feel check:** clicar o tile abre/fecha a faixa 1.5/3/4.5/7 sem salto; spam no toggle retargeta (CSS transition).

---

## Ordem de execução

1. Odometer (diff mínimo, alto impacto)
2. IconButton
3. Score accordion (espelhar ColorField)
4. Escrever `plans/002-odometer-duration.md`, `003-icon-button-press.md`, `004-score-threshold-accordion.md` e marcar DONE no README ao concluir

## Fora de escopo

- Photo crossfade, TubeText, specimen squish/pop, DialKit, theme crossfade
- Alterar `transition-all` global no shadcn `Button`
- Mudar delays de Tooltip

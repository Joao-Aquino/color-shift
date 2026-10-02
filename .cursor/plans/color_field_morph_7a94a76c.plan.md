---
name: Color field morph
overview: "O editor deixa o slot separado da sidebar e passa a abrir dentro do ColorField ativo: o pill tingido vira o card do Figma e o ColorEditor atual aparece com uma transição em CSS."
todos:
  - id: nest-editor
    content: Mover o ColorEditor para dentro do ColorField ativo e remover o slot da sidebar
    status: completed
  - id: morph-shell
    content: "Shell do field: pill tingido fecha, card sem tinta abre, altura em grid 0fr/1fr"
    status: completed
  - id: preserve-editor
    content: Portal para manter o formato ao trocar de linha; clique fora e foco no botão continuam
    status: completed
isProject: false
---

# Editor dentro do ColorField

Sim. O frame [3359:1654](https://www.figma.com/design/Fu0DGoLsLeY6wj7oLr5cVh/Color-Shift?node-id=3359-1654) já descreve as duas variantes do mesmo componente: pill fechado e card aberto. O código hoje separa isso em [`ColorFields`](components/control-bar/color-fields.tsx) e um slot `#color-editor` em [`ControlContainer`](components/control-bar/control-container.tsx).

O quadrado 2D do frame fica de fora. A spec da fase 2 e o style guide já recusam picker e alpha; o que entra é o `ColorEditor` que existe (abas, três sliders, readout).

## Comportamento

- Clique na linha continua abrindo aquele alvo. Clique na outra linha troca o card aberto. Clique fora ou `Esc` fecha e devolve o foco ao botão, como hoje.
- Fechado: pill `h-12`, raio cheio, fundo `color-mix` a 15% da cor, sem borda.
- Aberto: o mesmo shell vira o card do Figma — fundo `--color-chrome-bg`, borda `--color-chrome-border`, raio 24px, padding 8px. A linha (rótulo, hex, swatch) fica no topo, sem o tingimento. O editor aparece embaixo.
- A outra linha permanece o pill.

## Transição

CSS, sem GSAP (isso continua na fase 7). No shell: `background-color`, `border-color`, `border-radius` e padding em ~200ms. A altura do editor usa `grid-template-rows: 0fr → 1fr` com `overflow: hidden`, para o pill crescer até o card em vez de aparecer cortado.

## Estrutura

O shell deixa de ser um `<button>` (o editor tem controles e não pode ficar dentro de um botão).

```tsx
<div data-color-field-shell={target}> {/* morph do card */}
  <button data-color-field={target} aria-expanded={active} aria-controls="color-editor">
    label · hex · swatch
  </button>
  <div className="grid"> {/* 0fr / 1fr */}
    <div ref={slot} />
  </div>
</div>
```

`ColorEditor` continua em [`color-editor.tsx`](components/control-bar/color-editor.tsx), mas perde o chrome próprio (borda, fundo, raio, padding) porque o card do field passa a ser essa caixa. Ganha `id="color-editor"`.

Para o formato ativo (HEX/RGB/…) não resetar ao trocar de linha, o editor fica montado uma vez em `ColorFields` e entra no field ativo via portal. Fechar desmonta, igual a hoje.

## Fiação

- [`control-container.tsx`](components/control-bar/control-container.tsx): some o slot `editor-region`. `ColorFields` recebe o node do editor.
- [`color-shift-app.tsx`](components/color-shift-app.tsx): o clique de fora também ignora `[data-color-field-shell]`, senão um clique no padding do card fecha o editor. O foco no fechar continua no botão `[data-color-field]`.

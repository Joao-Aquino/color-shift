/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { converter, wcagContrast } = require('culori');
function load(file) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname,file),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
  }).outputText;
  const sandbox = {exports:{},require:name=>name === './contrast' ? load('../lib/color/contrast.ts') : require(name)};
  vm.runInNewContext(source,sandbox);
  return sandbox.exports;
}
const { adaptColorPairToTheme } = load('../lib/color/theme-pair.ts');
const oklch = converter('oklch');
const colors = ['#000000','#FFFFFF','#333333','#999999','#FF0000','#FFFF00','#0000FF','#EA7CCE','#2C4841'];
for (const background of colors) for (const foreground of colors) for (const theme of ['light','dark']) {
  const palette = {};
  const original = {background,foreground,originalForeground:foreground,wasBumped:false,palette};
  const pair = adaptColorPairToTheme(original,theme);
  const bg = oklch(pair.background).l, fg = oklch(pair.foreground).l;
  assert.ok(theme === 'light' ? bg >= .815 && fg <= .355 : bg <= .285 && fg >= .815,JSON.stringify({theme,pair,bg,fg}));
  assert.ok(wcagContrast(pair.background,pair.foreground)>=4.5,JSON.stringify({theme,pair}));
  assert.equal(original.background,background);
  assert.equal(original.foreground,foreground);
  assert.equal(pair.palette,palette);
}
console.log('PASS 162 pairs: theme polarity, genuinely light/dark backgrounds, minimum contrast and no input mutation');

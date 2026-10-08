/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file,environment) {
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname,file),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
 }).outputText,{exports,URL,Response,console,...environment});
 return exports;
}
(async()=>{
 const observed=[];
 const api=load('../lib/photos/unsplash.ts',{
  require:()=>({}),process:{env:{UNSPLASH_ACCESS_KEY:'test-only'}},
  fetch:async(url,options)=>{
   observed.push(new URL(url));assert.equal(options.headers.Authorization,'Client-ID test-only');
   return {ok:true,json:async()=>[{id:'test',width:1200,height:900,color:'#888888',urls:{raw:'https://images.unsplash.com/test?ixid=preserved',small:'https://images.unsplash.com/thumb'},links:{html:'https://unsplash.com/photos/test'},user:{name:'Test',links:{html:'https://unsplash.com/@test'}}}]};
  },
 });
 for(const theme of ['light','dark',undefined]){
  const [photo]=await api.getRandomPhotos(4,theme);
  const url=observed.at(-1);
  assert.equal(url.pathname,'/photos/random');assert.equal(url.searchParams.get('count'),'4');
  assert.equal(url.searchParams.get('orientation'),'landscape');assert.equal(url.searchParams.get('content_filter'),'high');
  const query=url.searchParams.get('query');
  assert.ok(query.includes('abstract'));
  if(theme)assert.ok(query.startsWith(theme==='light'?'bright light ':'dark '));
  else assert.ok(!query.startsWith('bright light ')&&!query.startsWith('dark '));
  assert.equal(new URL(photo.url).searchParams.get('ixid'),'preserved');
  assert.equal(new URL(photo.url).searchParams.get('w'),'2400');
 }
 const calls=[];
 const route=load('../app/api/photos/route.ts',{require:()=>({getRandomPhotos:async(count,theme)=>{calls.push({count,theme});return [];}})});
 for(const [query,count,theme] of [['count=4&theme=light',4,'light'],['count=4&theme=dark',4,'dark'],['count=999&theme=invalid',30,undefined],['count=0',1,undefined]]){
  const response=await route.GET(new Request(`http://localhost/api/photos?${query}`));
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(calls.at(-1),{count,theme});
 }
 console.log('PASS themed/default Unsplash queries, original quality/tracking, allowed theme validation and bounded counts');
})().catch(e=>{console.error(e);process.exitCode=1});

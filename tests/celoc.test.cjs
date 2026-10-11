// CELOC smoke test: run with node --test tests/celoc.test.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function mount(fields, saved={}) {
  const els={};
  for(const [id,value] of Object.entries(fields)) els[id]={value:String(value),closest:()=>null};
  const app={
    innerText:'Deal Analyzer',
    querySelector:(q)=>q==='.detailGrid,.analyzerRightColumn'?{}:null,
    querySelectorAll:()=>Object.values(els),
  };
  const doc={
    readyState:'loading',
    getElementById:(id)=>id==='app'?app:els[id]||null,
    addEventListener:()=>{},
  };
  const storage={getItem:()=>JSON.stringify(saved),setItem:()=>{}};
  const context={document:doc,localStorage:storage,window:{addEventListener:()=>{}},console};
  vm.runInNewContext(fs.readFileSync('celoc-analyzer.js','utf8'),context);
  return {context,els};
}
test('CELOC module parses in an isolated browser-like environment',()=>{
  const {context}=mount({visibleOfferInput:250000,d_price:300000,visibleAskingInput:350000});
  assert.ok(context.window.JGAPCELOC);
  assert.equal(typeof context.window.JGAPCELOC.refresh,'function');
});
test('CELOC price precedence and down-payment logic are present',()=>{
  const s=fs.readFileSync('celoc-analyzer.js','utf8');
  assert.ok(s.indexOf("'visibleOfferInput'")<s.indexOf("'d_price'"));
  assert.match(s,/dealDown\/dealPrice\*100/);
  assert.match(s,/saved\.a \?\? saved\.amount/);
  assert.match(s,/saved\.r \?\? saved\.rate/);
});

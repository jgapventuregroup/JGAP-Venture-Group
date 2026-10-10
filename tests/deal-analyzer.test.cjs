const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
function getFunction(name,nextName){
  const begin=source.indexOf('function '+name+'(');
  assert.ok(begin>=0,name+' must exist');
  const end=source.indexOf('function '+nextName+'(',begin+1);
  assert.ok(end>begin,nextName+' must follow '+name);
  return source.slice(begin,end);
}
const calc=getFunction('calcDeal','applyCalculatedOffer');
function evaluate(fields){
  const elements=new Map();
  for(const [id,value] of Object.entries(fields))elements.set(id,{value:String(value),textContent:'',innerHTML:'',style:{}});
  const get=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',style:{}});return elements.get(id)};
  const ctx={document:{getElementById:get},n:id=>Number(get(id).value)||0,money2:v=>'$'+Math.round(Number(v)||0).toLocaleString('en-US'),setupDealAnalyzerCollapsibles:()=>{}};
  vm.runInNewContext(calc+';calcDeal()',ctx);
  return get;
}
const baseline={
 d_price:250000,d_down:50000,d_rate:7,d_term:30,d_close:5000,d_rehab:10000,
 d_rent:3500,d_vacancy:5,d_exp:1300,d_other:0,d_loan_structure:'amortizing',
 d_target_coc:8,d_target_cap:8,d_target_dscr:'',d_min_cf:0,d_offer_buffer:5,
 d_asking:300000,d_target_offer:240000
};
test('complete underwriting yields a calculated maximum price',()=>{
 const get=evaluate(baseline);
 assert.notEqual(get('r_jgap_max_price').textContent,'Incomplete');
 assert.match(get('financingComparison').innerHTML,/Monthly Debt/);
});
test('missing operating expenses blocks maximum offer recommendation',()=>{
 const get=evaluate({...baseline,d_exp:0});
 assert.equal(get('r_jgap_max_price').textContent,'Incomplete');
 assert.equal(get('visibleMaxOffer').textContent,'Incomplete');
 assert.match(get('targetPriceMessage').innerHTML,/missing underwriting inputs/);
 assert.match(get('offerAnalysisTable').innerHTML,/Incomplete/);
});
test('cash comparison uses full purchase price and zero loan',()=>{
 const get=evaluate({...baseline,d_loan_structure:'none',d_down:0});
 const html=get('financingComparison').innerHTML;
 assert.match(html,/\$250,000/);
 assert.match(html,/\$265,000/);
 assert.match(html,/\$0/);
 assert.doesNotMatch(html,/\$225,000/);
});
test('financing comparison never displays negative rates',()=>{
 const get=evaluate({...baseline,d_rate:0});
 assert.doesNotMatch(get('financingComparison').innerHTML,/>-1\.00%/);
});
test('missing target does not create a fake asking-price gap',()=>{
 const get=evaluate({...baseline,d_target_cap:0,d_target_coc:0,d_target_dscr:'',d_min_cf:0});
 assert.match(get('offerAnalysisTable').innerHTML,/>—<\/td>/);
});

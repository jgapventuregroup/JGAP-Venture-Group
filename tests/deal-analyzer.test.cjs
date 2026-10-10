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
  const ctx={document:{getElementById:get},n:id=>Number(get(id).value)||0,money2:v=>'$'+Math.round(Number(v)||0).toLocaleString('en-US'),setupDealAnalyzerCollapsibles:()=>{},escapeHtml:v=>String(v)};
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
 assert.match(html,/<td>\$0<\/td><td>\$265,000<\/td><td>\$0<\/td>/);
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

test('save synchronizes visible asking and offer prices before building payload',()=>{
 const save=source.slice(source.indexOf('async function saveDeal(){'),source.indexOf('async function loadClosingTracker(',source.indexOf('async function saveDeal(){')));
 assert.ok(save.includes('if(visibleAsk&&askField)askField.value=visibleAsk.value;'));
 assert.ok(save.includes('if(visibleOffer&&offerField)offerField.value=visibleOffer.value;'));
 assert.ok(save.includes('if(testPrice&&visibleOffer&&visibleOffer.value!=="")testPrice.value=visibleOffer.value;'));
 assert.ok(save.indexOf('askField.value=visibleAsk.value')<save.indexOf('const payload='));
 assert.ok(save.indexOf('offerField.value=visibleOffer.value')<save.indexOf('const payload='));
});
test('clearing both visible prices clears stale price before saving',()=>{
 const save=source.slice(source.indexOf('async function saveDeal(){'),source.indexOf('async function loadClosingTracker(',source.indexOf('async function saveDeal(){')));
 assert.match(save,/else if\(testPrice&&\(visibleOffer\|\|visibleAsk\)\)testPrice.value="";/);
});

test('all-cash deal uses full purchase price for invested capital and cash-on-cash',()=>{
 const get=evaluate({...baseline,d_loan_structure:'none',d_down:0});
 assert.equal(get('r_loan').textContent,'$0');
 assert.equal(get('r_debt').textContent,'$0');
 assert.equal(get('r_cash').textContent,'$265,000');
 assert.equal(get('r_coc').textContent,'9.17%');
 assert.match(get('priceSensitivity').innerHTML,/\$265,000/);
 assert.match(get('offerWorksheet').innerHTML,/\$255,000/);
});

test('missing loan term blocks underwriting instead of silently assuming one year',()=>{
 const get=evaluate({...baseline,d_term:0});
 assert.equal(get('r_target').textContent,'Incomplete underwriting');
 assert.equal(get('r_jgap_max_price').textContent,'Incomplete');
 assert.match(get('dealStatus').innerHTML,/Loan term is missing/);
});
test('cash deals do not require a loan term',()=>{
 const get=evaluate({...baseline,d_loan_structure:'none',d_down:0,d_term:0});
 assert.notEqual(get('r_target').textContent,'Incomplete underwriting');
});

async function evaluateSave(visibleAsk,visibleOffer){
 const begin=source.indexOf('async function saveDeal(){');
 const end=source.indexOf('async function loadClosingTracker(',begin);
 assert.ok(begin>=0&&end>begin);
 const elements=new Map();
 const get=id=>{
  if(!elements.has(id))elements.set(id,{value:'',dataset:{},textContent:'',innerHTML:'',style:{}});
  return elements.get(id);
 };
 get('dealSaveMsg').dataset.id='test-existing-deal';
 get('d_name').value='Test deal';
 get('d_type').value='multifamily';
 get('d_notes').value='';
 get('d_asking').value='999999';
 get('d_target_offer').value='888888';
 get('d_price').value='777777';
 get('visibleAskingInput').value=visibleAsk;
 get('visibleOfferInput').value=visibleOffer;
 let saved;
 const context={
  document:{getElementById:get},
  n:id=>Number(get(id).value)||0,
  sb:{from:table=>{
   assert.equal(table,'deals');
   return {update:payload=>({eq:async(column,id)=>{
    assert.equal(column,'id');assert.equal(id,'test-existing-deal');
    saved=payload;return {error:null};
   }})};
  }},
  ensureDealChecklist:async()=>{},
  setTimeout:()=>{},
  renderDealsPage:()=>{},
  window:{},
  escapeHtml:String
 };
 await vm.runInNewContext(source.slice(begin,end)+';saveDeal()',context);
 return {saved,get};
}
test('Save Deal actually writes edited visible prices to the update payload',async()=>{
 const {saved}=await evaluateSave('325000','280000');
 assert.equal(saved.asking_price,325000);
 assert.equal(saved.target_offer_price,280000);
 assert.equal(saved.purchase_price,280000);
});
test('Save Deal falls back to asking price when offer is empty',async()=>{
 const {saved}=await evaluateSave('325000','');
 assert.equal(saved.asking_price,325000);
 assert.equal(saved.target_offer_price,null);
 assert.equal(saved.purchase_price,325000);
});
test('Save Deal removes stale prices when both visible inputs are cleared',async()=>{
 const {saved}=await evaluateSave('','');
 assert.equal(saved.asking_price,null);
 assert.equal(saved.target_offer_price,null);
 assert.equal(saved.purchase_price,0);
});

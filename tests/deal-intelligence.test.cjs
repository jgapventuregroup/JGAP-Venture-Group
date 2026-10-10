// Run with: node --test tests/deal-intelligence.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync('deal-intelligence-adapter.js','utf8'), {window});
const adapter = window.JGAPDealIntelligenceAdapter;

test('normalizes sample records payload with correct price and units', () => {
  const result = adapter.normalizeMany({records:[{id:'TEST-001',listPrice:650000,units:8,capRate:0.091}]}, 'test');
  assert.equal(result.length,1);
  assert.equal(result[0].asking_price,650000);
  assert.equal(result[0].units,8);
  assert.equal(result[0].cap_rate,9.1);
});

test('bedrooms are not treated as rental units', () => {
  const result = adapter.normalize({id:'HOME-001',beds:4,listPrice:200000},'test');
  assert.equal(result.units,null);
});

test('malformed record collections do not crash', () => {
  assert.equal(adapter.normalizeMany({records:{}},'test').length,0);
});

test('drops listings without an external identifier', () => {
  assert.equal(adapter.normalizeMany({records:[{listPrice:100000}]},'test').length,0);
});

const importerSource=fs.readFileSync('deal-intelligence-importer.js','utf8').replace(/export function /g,'function ');
const importerContext={};
vm.runInNewContext(importerSource+';this.filterTargetMarket=filterTargetMarket;',importerContext);
test('market filter accepts Tri-Cities TN multifamily and excludes distant TN/VA',()=>{
 const records=[
  {city:'Bristol',state:'TN',property_type:'duplex',units:2},
  {city:'Johnson City',state:'Tennessee',property_type:'apartment',units:8},
  {city:'Nashville',state:'TN',property_type:'apartment',units:8},
  {city:'Richmond',state:'VA',property_type:'apartment',units:8},
  {city:'Bristol',state:'VA',property_type:'duplex',units:2}
 ];
 const results=importerContext.filterTargetMarket(records);
 assert.equal(results.length,2);
 assert.equal(results[0].city,'Bristol');
 assert.equal(results[1].city,'Johnson City');
});

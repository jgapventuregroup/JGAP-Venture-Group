/* JGAP CELOC Analyzer - isolated module. Never edits existing analyzer calculations. */
(function(){
  'use strict';
  var VERSION='20261005-1';
  var RATE_DEFAULT=7.5;
  var panelId='jgapCelocPanel';
  var stateKey='jgap_celoc_v1';

  function money(n){
    n=Number(n)||0;
    return n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
  }
  function pct(n){ return (Number(n)||0).toFixed(2)+'%'; }
  function num(v){
    if(typeof v==='number') return v;
    return Number(String(v||'').replace(/[$,%\s,]/g,''))||0;
  }
  function getStore(){ try{return JSON.parse(localStorage.getItem(stateKey)||'{}')||{};}catch(e){return{};} }
  function saveStore(x){ try{localStorage.setItem(stateKey,JSON.stringify(x));}catch(e){} }
  function dealKey(){
    var app=document.getElementById('app');
    if(!app) return 'current';
    var text=(app.innerText||'').slice(0,2500);
    var m=text.match(/(?:Address|Property Address)\s*[:\-]?\s*([^\n]+)/i);
    if(m&&m[1]) return m[1].trim().toLowerCase().slice(0,180);
    var h=app.querySelector('h1,h2,h3');
    return h&&h.textContent?h.textContent.trim().toLowerCase().slice(0,180):'current';
  }
  function findPurchasePrice(){
    var app=document.getElementById('app'); if(!app) return 0;
    var inputs=Array.prototype.slice.call(app.querySelectorAll('input'));
    for(var i=0;i<inputs.length;i++){
      var el=inputs[i], meta=((el.name||'')+' '+(el.id||'')+' '+(el.placeholder||'')).toLowerCase();
      if(/purchase.*price|asking.*price|offer.*price|purchaseprice/.test(meta)) return num(el.value);
    }
    var labels=Array.prototype.slice.call(app.querySelectorAll('label'));
    for(var j=0;j<labels.length;j++){
      var t=(labels[j].textContent||'').toLowerCase();
      if(/purchase price|asking price|offer price/.test(t)){
        var inp=labels[j].querySelector('input'); if(inp) return num(inp.value);
      }
    }
    return 0;
  }
  function findDownPct(){
    var app=document.getElementById('app'); if(!app) return 20;
    var inputs=Array.prototype.slice.call(app.querySelectorAll('input'));
    for(var i=0;i<inputs.length;i++){
      var el=inputs[i], meta=((el.name||'')+' '+(el.id||'')+' '+(el.placeholder||'')).toLowerCase();
      if(/down.*payment.*%|downpayment.*percent|down.*percent/.test(meta)) return num(el.value)||20;
    }
    return 20;
  }
  function render(){
    var app=document.getElementById('app');
    if(!app) return;
    var hasAnalyzer=!!app.querySelector('.detailGrid,.analyzerRightColumn') || /deal\s*analyzer|analyze deal/i.test(app.innerText||'');
    if(!hasAnalyzer){ var old=document.getElementById(panelId); if(old) old.remove(); return; }
    if(document.getElementById(panelId)) return;

    var store=getStore(), key=dealKey(), saved=store[key]||{};
    var purchase=findPurchasePrice();
    var downPct=Number(saved.downPct||findDownPct()||20);
    var amount=Number(saved.amount||0);
    if(!amount && purchase) amount=Math.round(purchase*downPct/100*100)/100;
    var rate=Number(saved.rate||RATE_DEFAULT);

    var panel=document.createElement('section');
    panel.id=panelId;
    panel.className='panel';
    panel.style.marginTop='6px';
    panel.innerHTML=''
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">'
      +'<div><h3 style="margin:0">CELOC Funding</h3><div class="muted" style="font-size:12px;margin-top:4px">Use your CELOC for the property down payment and show its carrying cost in the deal.</div></div>'
      +'<span class="pill">CELOC v'+VERSION.slice(-2)+'</span></div>'
      +'<div class="formGrid" style="margin-top:12px">'
      +'<label>CELOC Amount Used<input id="jgapCelocAmount" type="number" min="0" step="100" value="'+amount+'"></label>'
      +'<label>CELOC Interest Rate<input id="jgapCelocRate" type="number" min="0" step="0.01" value="'+rate+'"></label>'
      +'<label>Down Payment %<input id="jgapCelocDownPct" type="number" min="0" max="100" step="0.1" value="'+downPct+'"></label>'
      +'<label>Purchase / Offer Price<input id="jgapCelocPurchase" type="number" min="0" step="100" value="'+purchase+'"></label>'
      +'</div>'
      +'<div class="stats" style="margin-top:12px">'
      +'<div><span>Monthly CELOC Interest</span><b id="jgapCelocMonthly">$0</b></div>'
      +'<div><span>Annual CELOC Interest</span><b id="jgapCelocAnnual">$0</b></div>'
      +'<div><span>CELOC % of Purchase</span><b id="jgapCelocPct">0%</b></div>'
      +'</div>'
      +'<div class="toolbar" style="margin-top:12px">'
      +'<button class="secondary" type="button" id="jgapCelocUseDown">Set amount from down payment</button>'
      +'<button class="primary" type="button" id="jgapCelocSave">Save CELOC to this deal</button>'
      +'</div>'
      +'<div id="jgapCelocStatus" class="muted" style="font-size:12px;margin-top:8px">CELOC cost is calculated as interest-only at the entered rate. Principal repayment is not assumed.</div>';

    var target=app.querySelector('.analyzerRightColumn');
    if(target) target.insertBefore(panel,target.firstChild);
    else {
      target=app.querySelector('.detailGrid');
      if(target) target.appendChild(panel); else app.prepend(panel);
    }

    function values(){
      var a=num(document.getElementById('jgapCelocAmount').value);
      var r=num(document.getElementById('jgapCelocRate').value);
      var p=num(document.getElementById('jgapCelocPurchase').value);
      var d=num(document.getElementById('jgapCelocDownPct').value);
      return {a:a,r:r,p:p,d:d};
    }
    function calc(){
      var v=values(), monthly=v.a*v.r/100/12, annual=monthly*12, ratio=v.p?v.a/v.p*100:0;
      document.getElementById('jgapCelocMonthly').textContent=money(monthly);
      document.getElementById('jgapCelocAnnual').textContent=money(annual);
      document.getElementById('jgapCelocPct').textContent=pct(ratio);
    }
    ['jgapCelocAmount','jgapCelocRate','jgapCelocPurchase','jgapCelocDownPct'].forEach(function(id){document.getElementById(id).addEventListener('input',calc);});
    document.getElementById('jgapCelocUseDown').addEventListener('click',function(){
      var v=values();
      document.getElementById('jgapCelocAmount').value=(v.p*v.d/100).toFixed(2);
      calc();
    });
    document.getElementById('jgapCelocSave').addEventListener('click',function(){
      var v=values(); var s=getStore(); s[key]=v; saveStore(s);
      document.getElementById('jgapCelocStatus').textContent='Saved to this deal. CELOC interest impact: '+money(v.a*v.r/100/12)+'/month ('+money(v.a*v.r/100)+'/year).';
    });
    calc();
  }

  function boot(){
    render();
    var app=document.getElementById('app');
    if(app){
      var observer=new MutationObserver(function(){
        clearTimeout(boot._t); boot._t=setTimeout(render,120);
      });
      observer.observe(app,{childList:true,subtree:true});
    }
    window.addEventListener('hashchange',render);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.JGAPCELOC={version:VERSION,refresh:render};
})();

(function(){
"use strict";
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function money(v){var n=Number(v);return isFinite(n)?n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}):"—";}
function pct(v){var n=Number(v);return isFinite(n)?(n>=0?"+":"")+n.toFixed(1)+"%":"—";}
function card(title,body,meta){
 return '<div class="panel" style="margin:0"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h3 style="margin:0 0 6px">'+esc(title)+'</h3><div>'+body+'</div></div><span style="font-size:12px;padding:4px 8px;border-radius:999px;background:#eef5ff">Alert</span></div><div class="muted" style="margin-top:8px;font-size:12px">'+esc(meta||"")+'</div></div>';
}
function distanceMiles(a,b){
 var R=3958.8, p=Math.PI/180, dLat=(b[0]-a[0])*p, dLon=(b[1]-a[1])*p;
 var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a[0]*p)*Math.cos(b[0]*p)*Math.sin(dLon/2)*Math.sin(dLon/2);
 return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
var centers={
 KINGSPORT:[36.548434,-82.561819],BRISTOL:[36.569135,-82.197489],BLUFFCITY:[36.474271,-82.260969],
 JOHNSONCITY:[36.313440,-82.353473],BLOUNTVILLE:[36.5337,-82.3268],ELIZABETHTON:[36.3487,-82.2107],
 GREENEVILLE:[36.1632,-82.8307],ROGERSVILLE:[36.4109,-82.9996],MORRISTOWN:[36.21398,-83.29489]
};
function normalizeCity(v){return String(v||"").toUpperCase().replace(/[^A-Z]/g,"");}
function inTarget(r){
 var state=String(r.state||"TN").toUpperCase();
 if(state!=="TN")return false;
 var city=normalizeCity(r.city);
 if(centers[city])return true;
 var address=String(r.address||"").toUpperCase();
 for(var k in centers)if(address.indexOf(k.replace("JOHNSONCITY","JOHNSON CITY").replace("BLOUNTVILLE","BLOUNTVILLE"))>=0)return true;
 return false;
}
function radarScore(r,minPrice,maxPrice){
 var score=0,reasons=[],price=Number(r.asking_price),units=Number(r.units),cap=Number(r.cap_rate),dscr=Number(r.dscr);
 if(isFinite(cap)){if(cap>=8){score+=25;reasons.push("cap rate 8%+")}else if(cap>=6){score+=15;reasons.push("cap rate 6%+")}}
 if(isFinite(dscr)){if(dscr>=1.25){score+=20;reasons.push("DSCR 1.25+")}else if(dscr>=1.10){score+=10;reasons.push("DSCR 1.10+")}}
 if(isFinite(price)&&isFinite(units)&&units>0){var ppu=price/units;if(ppu<=100000){score+=20;reasons.push("≤ $100k/unit")}else if(ppu<=150000){score+=10;reasons.push("≤ $150k/unit")}}
 if(isFinite(price)&&minPrice!==null&&maxPrice!==null&&price>=minPrice&&price<=maxPrice){score+=15;reasons.push("inside JGAP price range")}
 if(String(r.source||"").trim()){score+=5;reasons.push("source identified")}
 return {score:score,reasons:reasons};
}
window.__jgapRadarAnalyzerQueue={};
window.openRadarInAnalyzer=function(id){
 var r=window.__jgapRadarAnalyzerQueue[id];
 if(!r){alert("Refresh Alerts and try again.");return;}
 if(typeof window.renderDealAnalyzer!=="function"){alert("Deal Analyzer is not available. Refresh JGAP and try again.");return;}
 var address=[r.address,[r.city,r.state,r.postal_code].filter(Boolean).join(", ")].filter(Boolean).join(", ");
 window.renderDealAnalyzer({status:"analyzing",name:r.name||r.address||"Deal Radar Opportunity",property_type:"multifamily",property_address:address,property_county:"",offer_state:r.state||"TN",purchase_price:r.asking_price,asking_price:r.asking_price,units:r.units,monthly_rent:r.monthly_rent,monthly_operating_expenses:r.monthly_operating_expenses,vacancy_rate:r.vacancy_rate,notes:[r.source?r.source+" listing":"",r.source_url||""].filter(Boolean).join("\n")});
};
window.renderAlertsPage=function(){
 var main=document.querySelector("main");if(!main)main=document.getElementById("app");if(!main)return;
 main.innerHTML='<div class="pageHead"><div><h1>Alerts</h1><p class="muted">Deal Radar, multifamily opportunities, market history and rent-growth signals.</p></div><button class="secondary" onclick="render()">← Dashboard</button></div><div id="jgapAlertsStatus" class="panel">Loading alerts...</div>';
 var status=document.getElementById("jgapAlertsStatus");
 var timeout=function(p){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error("Request timed out. Check Supabase and refresh JGAP."));},10000);})]);};
 Promise.all([
  timeout(sb.from("deals").select("id,name,property_address,property_county,offer_state,property_type,status,asking_price,monthly_rent,units,neighborhood,created_at").order("created_at",{ascending:false}).limit(100)),
  timeout(sb.from("radar_opportunities").select("id,name,source,source_url,property_type,address,city,state,postal_code,units,asking_price,cap_rate,dscr,status,first_seen_at,last_seen_at").eq("status","new").order("first_seen_at",{ascending:false}).limit(100)),
  timeout(sb.from("market_history").select("deal_id,recorded_at,price,monthly_rent,neighborhood").order("recorded_at",{ascending:true}).limit(500))
 ]).then(function(results){
  var deals=results[0].data||[],radar=results[1].data||[],history=results[2].data||[];
  if(results[0].error)throw results[0].error;if(results[1].error)throw results[1].error;if(results[2].error)throw results[2].error;
  var multi=deals.filter(function(d){return /multi|duplex|triplex|quad|fourplex|apart/i.test(String(d.property_type||""));});
  var targetRadar=radar.filter(function(r){return /multi|duplex|triplex|quad|fourplex|apart/i.test(String(r.property_type||""))&&inTarget(r);});
  var prices=multi.map(function(d){return Number(d.asking_price)}).filter(isFinite).filter(function(v){return v>0;});
  var minPrice=prices.length?Math.min.apply(Math,prices):null,maxPrice=prices.length?Math.max.apply(Math,prices):null;
  targetRadar.forEach(function(r){var s=radarScore(r,minPrice,maxPrice);r.radarScore=s.score;r.radarReasons=s.reasons;window.__jgapRadarAnalyzerQueue[r.id]=r;});
  multi.slice(0,12).forEach(function(d){window.__jgapRadarAnalyzerQueue["deal:"+d.id]=d;});
  var alerts=[];
  targetRadar.slice(0,12).forEach(function(r){
   var loc=[r.city,r.state,r.postal_code].filter(Boolean).join(", ")||r.address||"Location not provided";
   var body='<b>'+esc(r.name||r.address||"Multifamily opportunity")+'</b><br>'+esc(loc)+(r.units!=null?" · Units: <b>"+esc(r.units)+"</b>":"")+" · Asking price: <b>"+money(r.asking_price)+"</b>";
   body+='<div style="margin-top:10px"><button class="primary radar-analyze-btn" type="button" data-radar-id="'+esc(r.id)+'">Analyze in Deal Analyzer</button>';
   if(r.source_url) body+='<a class="secondary" target="_blank" rel="noopener" href="'+esc(r.source_url)+'" style="margin-left:8px">Open Listing</a>';
   body+='</div>';
   alerts.push(card("📡 New Deal Radar opportunity",body,"Priority "+r.radarScore+"/100"+(r.radarReasons.length?" · "+r.radarReasons.join(" · "):"")));
  });
  multi.slice(0,12).forEach(function(d){
   var body='<b>'+esc(d.property_address||d.name||"JGAP Property")+'</b><br>Asking price: <b>'+money(d.asking_price)+'</b> · Status: <b>'+esc(d.status||"—")+'</b>';
   body+='<div style="margin-top:10px"><button class="primary radar-analyze-btn" type="button" data-radar-id="deal:'+esc(d.id)+'">Analyze in Deal Analyzer</button></div>';
   alerts.push(card("🔔 New multifamily property",body,"Added to JGAP "+new Date(d.created_at).toLocaleString()));
  });
  var growth=[];
  var byNeighborhood={};
  history.forEach(function(h){var n=String(h.neighborhood||"").trim();if(!n)return;(byNeighborhood[n]||(byNeighborhood[n]=[])).push(h);});
  Object.keys(byNeighborhood).forEach(function(n){var rows=byNeighborhood[n];if(rows.length<2)return;var first=rows[0],last=rows[rows.length-1],days=(new Date(last.recorded_at)-new Date(first.recorded_at))/86400000;if(days<365)return;var old=Number(first.monthly_rent),now=Number(last.monthly_rent);if(isFinite(old)&&old>0&&isFinite(now)){var change=(now-old)/old*100;if(change>=8)growth.push(card("📈 Neighborhood rent growth","<b>"+esc(n)+"</b><br>Observed rent change: <b>"+pct(change)+"</b>","At least 365 days of recorded JGAP history"));}});
  var html='<div class="sectionTitle">Active Alerts</div><div style="display:grid;gap:10px">'+(alerts.length?alerts.join(""):'<div class="muted">No new targeted multifamily opportunities right now.</div>')+'</div>';
  html+='<h3 style="margin-top:22px">Growth Signals</h3><div style="display:grid;gap:10px">'+(growth.length?growth.join(""):'<div class="muted">No 8%+ recorded rent-growth signals yet.</div>')+'</div>';
  html+='<h3 style="margin-top:22px">Active Rules</h3><div class="muted">Target market: Tennessee · Northeast Tennessee city targeting · Multifamily only · Deal Radar priority scoring · JGAP market-history signals.</div>';
  status.className="panel";status.innerHTML=html;
  Array.prototype.forEach.call(status.querySelectorAll(".radar-analyze-btn"),function(btn){
    btn.addEventListener("click",function(){window.openRadarInAnalyzer(btn.getAttribute("data-radar-id"));});
  });
 }).catch(function(e){status.innerHTML='<div class="error"><b>Could not load alert data.</b><div style="margin-top:8px;font-size:13px">'+esc(e.message||String(e))+'</div></div>';});
};
})();
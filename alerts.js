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
 KINGSPORT:[36.548434,-82.561819],BRISTOL:[36.569135,-82.197489],BRISTOLVA:[36.6112,-82.1792],BLUFFCITY:[36.474271,-82.260969],
 JOHNSONCITY:[36.313440,-82.353473],BLOUNTVILLE:[36.5337,-82.3268],ELIZABETHTON:[36.3487,-82.2107],
 GREENEVILLE:[36.1632,-82.8307],ROGERSVILLE:[36.4109,-82.9996],MORRISTOWN:[36.21398,-83.29489]
};
function normalizeCity(v){return String(v||"").toUpperCase().replace(/[^A-Z]/g,"");}
function inTarget(r){
 var state=String(r.state||"TN").toUpperCase();
 if(state!=="TN"&&state!=="VA")return false;
 var city=normalizeCity(r.city);
 if(centers[city])return true;
 var address=String(r.address||"").toUpperCase();
 for(var k in centers)if(address.indexOf(k.replace("JOHNSONCITY","JOHNSON CITY").replace("BLOUNTVILLE","BLOUNTVILLE"))>=0)return true;
 return false;
}
function radarDataQuality(r){var issues=[];if(!(Number(r.asking_price)>0))issues.push("asking price missing");if(!(Number(r.monthly_rent)>0))issues.push("rent missing");if(!(Number(r.units)>0))issues.push("units missing");if(!(Number(r.monthly_operating_expenses)>0))issues.push("OpEx missing");return issues;}
function radarUnderwritingStatus(r){var issues=radarDataQuality(r),arv=Number(r.arv);if(!(arv>0))issues.push("ARV not established");return {ready:issues.length===0,issues:issues};}
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
window.promoteJgapDealToRadar=async function(id){
 var btn=document.querySelector('[data-promote-radar-id="'+CSS.escape(id)+'"]');
 if(btn)btn.disabled=true;
 var q=await sb.from("deals").select("id,company_id,name,property_address,property_county,offer_state,property_type,units,asking_price,monthly_rent,monthly_operating_expenses,vacancy_rate,status").eq("id",id).maybeSingle();
 if(q.error||!q.data){alert(q.error?.message||"Could not load the JGAP deal.");if(btn)btn.disabled=false;return;}
 var d=q.data;
 var cityState=String(d.property_address||"").split(",");
 var city=(cityState.length>1?cityState[cityState.length-2]:"").trim();
 var state=String(d.offer_state||"TN").toUpperCase();
 var externalId="jgap-deal:"+d.id;
 var row={company_id:d.company_id,name:d.name||d.property_address||"JGAP Deal",source:"JGAP",source_url:"",external_id:externalId,property_type:d.property_type||"multifamily",address:d.property_address||"",city:city,state:state,units:d.units||null,asking_price:d.asking_price||null,monthly_rent:d.monthly_rent||null,monthly_operating_expenses:d.monthly_operating_expenses||null,vacancy_rate:d.vacancy_rate||null,status:"new",first_seen_at:new Date().toISOString(),last_seen_at:new Date().toISOString(),notes:"Promoted from JGAP saved deal for Radar workflow testing."};
 var ins=await sb.from("radar_opportunities").upsert(row,{onConflict:"company_id,source,external_id"});
 if(ins.error){alert("Could not add to Deal Radar: "+ins.error.message);if(btn)btn.disabled=false;return;}
 if(btn){btn.textContent="In Deal Radar";btn.disabled=true;}
 alert("Added to Deal Radar. Refresh Alerts to see it.");
};

window.saveRadarAsDeal=function(id){
 var r=window.__jgapRadarAnalyzerQueue[id];
 if(!r){alert("Refresh Alerts and try again.");return;}
 if(typeof window.renderDealAnalyzer!=="function"||typeof window.saveDeal!=="function"){alert("Deal Analyzer is not available. Refresh JGAP and try again.");return;}
 var address=[r.address,[r.city,r.state,r.postal_code].filter(Boolean).join(", ")].filter(Boolean).join(", ");
 window.renderDealAnalyzer({status:"analyzing",name:r.name||r.address||"Deal Radar Opportunity",property_type:r.property_type||"multifamily",property_address:address,property_county:r.property_county||"",offer_state:r.state||"TN",purchase_price:r.purchase_price||r.asking_price,asking_price:r.asking_price,units:r.units,monthly_rent:r.monthly_rent,monthly_operating_expenses:r.monthly_operating_expenses,vacancy_rate:r.vacancy_rate,arv:r.arv,projected_sale_price:r.projected_sale_price,rehab_cost:r.rehab_cost,closing_costs:r.closing_costs,financing_costs:r.financing_costs,holding_months:r.holding_months,monthly_holding_costs:r.monthly_holding_costs,selling_cost_percent:r.selling_cost_percent,notes:[r.source?r.source+" listing":"",r.source_url||""].filter(Boolean).join("\n")});
 setTimeout(function(){window.saveDeal();},0);
};
window.openRadarInAnalyzer=function(id){
 var r=window.__jgapRadarAnalyzerQueue[id];
 if(!r){alert("Refresh Alerts and try again.");return;}
 if(typeof window.renderDealAnalyzer!=="function"){alert("Deal Analyzer is not available. Refresh JGAP and try again.");return;}
 var address=[r.address,[r.city,r.state,r.postal_code].filter(Boolean).join(", ")].filter(Boolean).join(", ");
 var payload={status:"analyzing",name:r.name||r.address||"Deal Radar Opportunity",property_type:r.property_type||"multifamily",property_address:address,property_county:r.property_county||"",offer_state:r.state||"TN",purchase_price:r.purchase_price||r.asking_price,asking_price:r.asking_price,units:r.units,monthly_rent:r.monthly_rent,monthly_operating_expenses:r.monthly_operating_expenses,vacancy_rate:r.vacancy_rate,arv:r.arv,projected_sale_price:r.projected_sale_price,rehab_cost:r.rehab_cost,closing_costs:r.closing_costs,financing_costs:r.financing_costs,holding_months:r.holding_months,monthly_holding_costs:r.monthly_holding_costs,selling_cost_percent:r.selling_cost_percent,notes:[r.source?r.source+" listing":"",r.source_url||""].filter(Boolean).join("\n")};
 window.renderDealAnalyzer(payload);
};
window.importRadarOpportunity=async function(){
 var f=document.getElementById("radarImportForm");if(!f)return;
 var msg=document.getElementById("radarImportMsg");
 var get=function(id){var e=document.getElementById(id);return e?e.value.trim():"";};
 var name=get("radarImportName"),address=get("radarImportAddress"),city=get("radarImportCity"),state=get("radarImportState").toUpperCase()||"TN";
 var source=get("radarImportSource"),url=get("radarImportUrl"),type=get("radarImportType")||"multifamily";
 var units=Number(get("radarImportUnits"))||null,price=Number(get("radarImportPrice"))||null,rent=Number(get("radarImportRent"))||null;
 if(!name||!address||!city||!price){if(msg)msg.textContent="Name, address, city, and asking price are required.";return;}
 if(!/TN|TENNESSEE|VA|VIRGINIA/.test(state)){if(msg)msg.textContent="Deal Radar is currently limited to JGAP target markets.";return;}
 var userRes=await sb.auth.getUser();var uid=userRes.data&&userRes.data.user?userRes.data.user.id:null;
 if(!uid){if(msg)msg.textContent="Please sign in again.";return;}
 var mem=await sb.from("company_members").select("company_id").eq("user_id",uid).limit(1).maybeSingle();
 if(mem.error||!mem.data){if(msg)msg.textContent="Could not determine your JGAP company access.";return;}
 var externalId="manual:"+btoa(unescape(encodeURIComponent(address+"|"+price))).replace(/[^A-Za-z0-9_-]/g,"").slice(0,120);
 var now=new Date().toISOString();
 var row={company_id:mem.data.company_id,name:name,source:source||"Manual",source_url:url||null,external_id:externalId,property_type:type,address:address,city:city,state:state,units:units,asking_price:price,monthly_rent:rent,status:"new",first_seen_at:now,last_seen_at:now,notes:"Manually imported into JGAP Deal Radar."};
 var ins=await sb.from("radar_opportunities").upsert(row,{onConflict:"company_id,source,external_id"});
 if(ins.error){if(msg)msg.textContent="Import failed: "+ins.error.message;return;}
 if(msg)msg.textContent="Opportunity added to Deal Radar. Refreshing...";
 f.reset();if(document.getElementById("radarImportState"))document.getElementById("radarImportState").value="TN";
 setTimeout(window.renderAlertsPage,400);
};
window.renderAlertsPage=function(){
 var main=document.querySelector("main");if(!main)main=document.getElementById("app");if(!main)return;
 main.innerHTML='<div class="pageHead"><div><h1>Alerts</h1><p class="muted">Deal Radar, multifamily opportunities, market history and rent-growth signals.</p></div><button class="secondary" onclick="render()">← Dashboard</button></div><div class="panel"><h3 style="margin-top:0">📥 Add Listing to Deal Radar</h3><p class="muted">Enter a listing you found online. JGAP will save it as a new Radar opportunity for screening.</p><form id="radarImportForm" onsubmit="event.preventDefault();importRadarOpportunity()" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px"><input id="radarImportName" placeholder="Property name" required><input id="radarImportAddress" placeholder="Street address" required><input id="radarImportCity" placeholder="City" required><input id="radarImportState" value="TN" placeholder="State" required><input id="radarImportSource" placeholder="Source (LoopNet, Crexi, etc.)"><input id="radarImportUrl" placeholder="Listing URL"><select id="radarImportType"><option value="multifamily">Multifamily</option><option value="duplex">Duplex</option><option value="triplex">Triplex</option><option value="quadplex">Quadplex</option><option value="apartment">Apartment</option></select><input id="radarImportUnits" type="number" min="1" placeholder="Units"><input id="radarImportPrice" type="number" min="0" step="1" placeholder="Asking price" required><input id="radarImportRent" type="number" min="0" step="1" placeholder="Monthly rent"><button class="primary" type="submit">Add to Deal Radar</button></form><div id="radarImportMsg" class="muted" style="margin-top:8px"></div></div><div id="jgapAlertsStatus" class="panel">Loading alerts...</div>';
 var status=document.getElementById("jgapAlertsStatus");
 var timeout=function(p){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error("Request timed out. Check Supabase and refresh JGAP."));},10000);})]);};
 Promise.all([
  timeout(sb.from("deals").select("id,name,property_address,property_county,offer_state,property_type,status,asking_price,purchase_price,monthly_rent,monthly_operating_expenses,vacancy_rate,units,neighborhood,arv,projected_sale_price,rehab_cost,closing_costs,financing_costs,holding_months,monthly_holding_costs,selling_cost_percent,created_at").order("created_at",{ascending:false}).limit(100)),
  timeout(sb.from("radar_opportunities").select("id,name,source,source_url,property_type,address,city,state,postal_code,units,asking_price,cap_rate,dscr,status,first_seen_at,last_seen_at").eq("status","new").order("first_seen_at",{ascending:false}).limit(100)),
  timeout(sb.from("market_history").select("deal_id,recorded_at,price,monthly_rent,neighborhood").order("recorded_at",{ascending:true}).limit(500))
 ]).then(function(results){
  var deals=results[0].data||[],radar=results[1].data||[],history=results[2].data||[];
  if(results[0].error)throw results[0].error;if(results[1].error)throw results[1].error;if(results[2].error)throw results[2].error;
  var multi=deals.filter(function(d){return /multi|duplex|triplex|quad|fourplex|apart/i.test(String(d.property_type||""));});
  var targetRadar=radar.filter(function(r){return /multi|duplex|triplex|quad|fourplex|apart/i.test(String(r.property_type||""))&&inTarget(r);});
  var prices=multi.map(function(d){return Number(d.asking_price)}).filter(isFinite).filter(function(v){return v>0;});
  var minPrice=prices.length?Math.min.apply(Math,prices):null,maxPrice=prices.length?Math.max.apply(Math,prices):null;
  targetRadar.forEach(function(r){
 var s=radarScore(r,minPrice,maxPrice); var quality=radarDataQuality(r);
 var keyAddr=String(r.address||"").trim().toLowerCase();
 var match=multi.find(function(d){return keyAddr&&String(d.property_address||"").trim().toLowerCase()===keyAddr;});
 if(match&&Number(match.arv)>0){
   var sale=Number(match.projected_sale_price)||Number(match.arv), sellPct=Math.min(100,Math.max(0,Number(match.selling_cost_percent)||0))/100;
   var totalCost=Number(match.purchase_price)||Number(r.asking_price)||0;
   totalCost+=Number(match.rehab_cost)||0; totalCost+=Number(match.closing_costs)||0; totalCost+=Number(match.financing_costs)||0;
   totalCost+=(Number(match.holding_months)||0)*(Number(match.monthly_holding_costs)||0);
   var breakEven=sellPct<1?totalCost/(1-sellPct):null;
   r.purchase_price=Number(match.purchase_price)||Number(r.asking_price);
   r.monthly_rent=Number(match.monthly_rent)||Number(r.monthly_rent)||0;
   r.monthly_operating_expenses=Number(match.monthly_operating_expenses)||0;
   r.vacancy_rate=Number(match.vacancy_rate)||0;
   r.rehab_cost=Number(match.rehab_cost)||0;r.closing_costs=Number(match.closing_costs)||0;
   r.financing_costs=Number(match.financing_costs)||0;r.holding_months=Number(match.holding_months)||0;
   r.monthly_holding_costs=Number(match.monthly_holding_costs)||0;r.selling_cost_percent=Number(match.selling_cost_percent)||0;
   r.arv=Number(match.arv);r.projected_sale_price=sale;r.seventyArvCeiling=r.arv*.70;
   if(breakEven!==null&&sale>0){r.arvBreakEven=breakEven;r.arvCushion=sale-breakEven;r.arvCushionPct=(sale-breakEven)/breakEven;}
 }
 r.radarScore=s.score;r.radarReasons=s.reasons.slice();r.radarQuality=quality;r.radarUnderwriting=radarUnderwritingStatus(r);if(quality.length)r.radarReasons.push("Needs underwriting: "+quality.join(", "));if(r.radarUnderwriting.ready)r.radarReasons.push("Ready for underwriting");if(r.arvCushionPct!=null)r.radarReasons.push("ARV cushion "+(r.arvCushionPct*100).toFixed(1)+"%");window.__jgapRadarAnalyzerQueue[r.id]=r;
});
  multi.slice(0,12).forEach(function(d){window.__jgapRadarAnalyzerQueue["deal:"+d.id]=d;});
  var alerts=[];
  targetRadar.slice(0,12).forEach(function(r){
   var loc=[r.city,r.state,r.postal_code].filter(Boolean).join(", ")||r.address||"Location not provided";
   var sourceLabel=String(r.source||"").trim();
   var uw=r.radarUnderwriting||{ready:false,issues:r.radarQuality||[]};
   var checklist=["Price: "+(Number(r.asking_price)>0?"✓":"Missing"),"Units: "+(Number(r.units)>0?"✓":"Missing"),"Rent: "+(Number(r.monthly_rent)>0?"✓":"Missing"),"OpEx: "+(Number(r.monthly_operating_expenses)>0?"✓":"Missing"),"ARV: "+(Number(r.arv)>0?"✓":"Missing")];
   var body='<b>'+esc(r.name||r.address||"Multifamily opportunity")+'</b><br>'+esc(loc)+(r.units!=null?" · Units: <b>"+esc(r.units)+"</b>":"")+" · Asking price: <b>"+money(r.asking_price)+"</b>";
   if(sourceLabel) body+='<div style="margin-top:6px" class="muted">Source: <b>'+esc(sourceLabel)+'</b></div>'; body+='<div style="margin-top:8px;padding:8px;border-radius:8px;background:#f5f7fa"><b>Underwriting readiness:</b> '+(uw.ready?"✓ Ready for Deal Analyzer":"⚠ Needs data")+'<div class="muted" style="margin-top:5px">'+esc(checklist.join(" · "))+'</div></div>'; var qualityLabel=Array.isArray(r.radarQuality)&&r.radarQuality.length?'<div style="margin-top:8px;padding:8px;border-radius:8px;background:#fff7e6"><b>⚠ Needs underwriting:</b> '+esc(r.radarQuality.join(", "))+'</div>':'<div style="margin-top:8px;padding:8px;border-radius:8px;background:#eef8ee"><b>✓ Basic listing data present</b></div>'; body+=qualityLabel;
   if(r.arvCushion!=null) body+='<div style="margin-top:8px" class="muted"><b>ARV underwriting:</b> ARV '+money(r.arv)+' · 70% ARV ceiling '+money(r.seventyArvCeiling)+' · Break-even '+money(r.arvBreakEven)+' · Cushion '+money(r.arvCushion)+' ('+(r.arvCushionPct*100).toFixed(1)+'%)</div>';
   body+='<div style="margin-top:10px"><button class="primary radar-analyze-btn" type="button" data-radar-id="'+esc(r.id)+'">Analyze in Deal Analyzer</button><button class="secondary radar-save-btn" type="button" data-radar-id="'+esc(r.id)+'" style="margin-left:8px">Save as JGAP Deal</button>';
   if(r.source_url) body+='<a class="secondary" target="_blank" rel="noopener" href="'+esc(r.source_url)+'" style="margin-left:8px">Open Listing</a>';
   body+='</div>';
   alerts.push(card("📡 New Deal Radar opportunity",body,"Priority "+r.radarScore+"/100"+(r.radarReasons.length?" · "+r.radarReasons.join(" · "):"")));
  });
  multi.slice(0,12).forEach(function(d){
   var body='<b>'+esc(d.property_address||d.name||"JGAP Property")+'</b><br>Asking price: <b>'+money(d.asking_price)+'</b> · Status: <b>'+esc(d.status||"—")+'</b>';
   body+='<div style="margin-top:10px"><button class="primary radar-analyze-btn" type="button" data-radar-id="deal:'+esc(d.id)+'">Analyze in Deal Analyzer</button><button class="secondary radar-promote-btn" type="button" data-promote-radar-id="'+esc(d.id)+'" style="margin-left:8px">Add to Deal Radar</button></div>';
   alerts.push(card("🔔 New multifamily property",body,"Added to JGAP "+new Date(d.created_at).toLocaleString()));
  });
  var growth=[];
  var byNeighborhood={};
  history.forEach(function(h){var n=String(h.neighborhood||"").trim();if(!n)return;(byNeighborhood[n]||(byNeighborhood[n]=[])).push(h);});
  Object.keys(byNeighborhood).forEach(function(n){var rows=byNeighborhood[n];if(rows.length<2)return;var first=rows[0],last=rows[rows.length-1],days=(new Date(last.recorded_at)-new Date(first.recorded_at))/86400000;if(days<365)return;var old=Number(first.monthly_rent),now=Number(last.monthly_rent);if(isFinite(old)&&old>0&&isFinite(now)){var change=(now-old)/old*100;if(change>=8)growth.push(card("📈 Neighborhood rent growth","<b>"+esc(n)+"</b><br>Observed rent change: <b>"+pct(change)+"</b>","At least 365 days of recorded JGAP history"));}});
  var recent=deals.slice(0,10);
  var recentCards=recent.map(function(d){return card("🧭 Recent Market Activity",'<b>'+esc(d.property_address||d.name||"JGAP property")+'</b><br>Asking price: <b>'+money(d.asking_price)+'</b> · Type: <b>'+esc(d.property_type||"—")+'</b> · Status: <b>'+esc(d.status||"—")+'</b>',"Recorded "+new Date(d.created_at).toLocaleString());});
  var historyDeals={};
  history.forEach(function(h){historyDeals[h.deal_id]=true;});
  var historyCards=multi.filter(function(d){return historyDeals[d.id];}).slice(0,10).map(function(d){return card("📊 Property with Market History",'<b>'+esc(d.property_address||d.name||"JGAP property")+'</b><br>Asking price: <b>'+money(d.asking_price)+'</b> · Units: <b>'+esc(d.units==null?"—":d.units)+'</b>',"Historical observations available in JGAP");});
  var priceRange=minPrice!==null&&maxPrice!==null?"Current JGAP multifamily asking-price range: <b>"+money(minPrice)+" to "+money(maxPrice)+"</b>":"Current JGAP multifamily asking-price range: <b>Not enough asking-price data yet</b>";
  function dropdown(title,body,open){
    return '<details class="panel" style="margin:0"'+(open?' open':'')+'><summary style="cursor:pointer;font-weight:700;font-size:17px;padding:2px 0">'+title+' <span class="muted" style="float:right;font-size:12px">Click to '+(open?'collapse':'expand')+'</span></summary><div style="margin-top:14px">'+body+'</div></details>';
  }
  var html='<div style="display:grid;gap:10px">';
  html+=dropdown("🚨 Active Alerts",'<div style="display:grid;gap:10px">'+(alerts.length?alerts.join(""):'<div class="muted">No new targeted multifamily opportunities right now. Listings outside JGAP target markets are not shown here.</div>')+'</div>',true);
  html+=dropdown("🧭 Recent Market Activity",'<div style="display:grid;gap:10px">'+(recentCards.length?recentCards.join(""):'<div class="muted">No recent market activity recorded yet.</div>')+'</div>',false);
  html+=dropdown("📈 Growth Signals",'<div style="display:grid;gap:10px">'+(growth.length?growth.join(""):'<div class="muted">No 8%+ recorded rent-growth signals yet.</div>')+'</div>',false);
  html+=dropdown("📊 Properties with History",'<div style="display:grid;gap:10px">'+(historyCards.length?historyCards.join(""):'<div class="muted">No properties have enough market-history observations yet.</div>')+'</div>',false);
  html+=dropdown("💰 Asking-Price Comparison",'<div class="panel" style="margin:0">'+priceRange+'</div>',false);
  html+=dropdown("⚙️ Active Rules",'<div class="muted">Target market: Tennessee · Northeast Tennessee city targeting · Multifamily only · Deal Radar priority scoring · JGAP market-history signals · Rent growth requires at least 365 days of recorded history.</div>',false);
  html+='</div>';
  status.className="panel";status.innerHTML=html;
  Array.prototype.forEach.call(status.querySelectorAll(".radar-analyze-btn"),function(btn){
    btn.addEventListener("click",function(){window.openRadarInAnalyzer(btn.getAttribute("data-radar-id"));});
  });
  Array.prototype.forEach.call(status.querySelectorAll(".radar-save-btn"),function(btn){
    btn.addEventListener("click",function(){window.saveRadarAsDeal(btn.getAttribute("data-radar-id"));});
  });
  Array.prototype.forEach.call(status.querySelectorAll(".radar-promote-btn"),function(btn){
    btn.addEventListener("click",function(){window.promoteJgapDealToRadar(btn.getAttribute("data-promote-radar-id"));});
  });
 }).catch(function(e){status.innerHTML='<div class="error"><b>Could not load alert data.</b><div style="margin-top:8px;font-size:13px">'+esc(e.message||String(e))+'</div></div>';});
};
})();
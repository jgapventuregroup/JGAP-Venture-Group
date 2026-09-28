(function(){
"use strict";
function esc(v){return String(v??"").replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]});}
function money(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}):"—";}
function pct(v){const n=Number(v);return Number.isFinite(n)?(n>0?"+":"")+n.toFixed(1)+"%":"—";}
function alertCard(title,body,meta,kind){return '<div class="panel" style="margin:0"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h3 style="margin:0 0 6px">'+esc(title)+'</h3><div>'+body+'</div></div><span style="font-size:12px;padding:4px 8px;border-radius:999px;background:'+(kind==="growth"?"#eef8ef":"#eef5ff")+'">'+(kind==="growth"?"Growth":"New observation")+'</span></div><div class="muted" style="margin-top:8px;font-size:12px">'+esc(meta)+'</div></div>';}
window.renderAlertsPage=async function(){
 const app=document.getElementById("app"); if(!app)return;
 app.innerHTML='<div class="pageHead"><div><h1>🔔 Alerts</h1><p class="muted">JGAP Phase 7 — alerts based on recorded property and market activity.</p></div><div><button type="button" class="secondary" onclick="render()">← Dashboard</button></div></div><div class="panel"><div id="jgapAlertsStatus">Starting Alerts…</div></div>';
 async function alertQuery(promise,label){
  return await Promise.race([
    promise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+" timed out after 10 seconds")),10000))
  ]);
 }
 let deals=[],history=[],de=null,he=null;
 try{
   const r=await alertQuery(
     sb.from("deals").select("id,name,property_address,property_county,offer_state,property_type,status,asking_price,monthly_rent,units,neighborhood,created_at").order("created_at",{ascending:false}).limit(500),
     "Deals query"
   );
   deals=r.data||[]; de=r.error||null;
 }catch(e){de={message:e.message};}
 try{
   const r=await alertQuery(
     sb.from("market_history").select("deal_id,recorded_at,price,monthly_rent,neighborhood").order("recorded_at",{ascending:false}).limit(1000),
     "Market history query"
   );
   history=r.data||[]; he=r.error||null;
 }catch(e){he={message:e.message};}
 if(de||he){
   const details=[de&&("Deals query: "+(de.message||"Unknown database error")),he&&("Market history query: "+(he.message||"Unknown database error"))].filter(Boolean).join("<br>");
   document.getElementById("jgapAlertsStatus").innerHTML='<div class="error"><b>Could not load alert data.</b><div style="margin-top:8px;font-size:13px">'+details+'</div></div>';
   return;
 }
 // Phase 7 automatic alert rules: only trigger from actual recorded JGAP data.
 const now=Date.now();
 const newMultifamily=(deals||[]).filter(d=>String(d.property_type||"").toLowerCase()==="multifamily" && now-new Date(d.created_at).getTime()<=7*86400000);
 const neighborhoodAlerts=[];
 const byNeighborhood={};
 (history||[]).forEach(h=>{const n=String(h.neighborhood||"").trim();if(n)(byNeighborhood[n]??=[]).push(h);});
 Object.entries(byNeighborhood).forEach(([n,rows])=>{
  const sorted=[...rows].sort((a,b)=>new Date(a.recorded_at)-new Date(b.recorded_at));
  const first=sorted[0], latest=sorted[sorted.length-1];
  const days=(new Date(latest.recorded_at)-new Date(first.recorded_at))/86400000;
  if(days<365 || sorted.length<2)return;
  if(Number.isFinite(Number(first.monthly_rent))&&Number(first.monthly_rent)!==0&&Number.isFinite(Number(latest.monthly_rent))){
   const change=(Number(latest.monthly_rent)-Number(first.monthly_rent))/Number(first.monthly_rent)*100;
   if(change>=8) neighborhoodAlerts.push({n,change,days});
  }
 });
 const automaticCards=[];
 const improvingNeighborhoods={};
 neighborhoodAlerts.forEach(x=>{improvingNeighborhoods[String(x.n).trim().toLowerCase()]=x;});
 newMultifamily.slice(0,12).forEach(d=>{
  const name=d.property_address||d.name||"JGAP Property";
  const n=String(d.neighborhood||"").trim();
  const improving=improvingNeighborhoods[n.toLowerCase()];
  if(improving){
   automaticCards.push(alertCard("🚨 New multifamily in improving neighborhood",'<b>'+esc(name)+'</b><br>'+esc(n)+' — observed rent change: <b>'+pct(improving.change)+'</b>','New JGAP property; neighborhood has at least 365 days of recorded rent history',"growth"));
  }
  automaticCards.push(alertCard("🔔 New multifamily property",'<b>'+esc(name)+'</b><br>Asking price: <b>'+money(d.asking_price)+'</b> · Status: <b>'+esc(d.status||"—")+'</b>','Added to JGAP '+new Date(d.created_at).toLocaleString(),"new"));
 });
  const name=d.property_address||d.name||"JGAP Property";
  automaticCards.push(alertCard("🔔 New multifamily property",'<b>'+esc(name)+'</b><br>Asking price: <b>'+money(d.asking_price)+'</b> · Status: <b>'+esc(d.status||"—")+'</b>','Added to JGAP '+new Date(d.created_at).toLocaleString(),"new"));
 });
 neighborhoodAlerts.slice(0,12).forEach(x=>{
  automaticCards.push(alertCard("📈 Neighborhood rent growth",'<b>'+esc(x.n)+'</b><br>Observed rent change: <b>'+pct(x.change)+'</b>','Based on at least 365 days of recorded JGAP history',"growth"));
 });

 const byDeal={}; (history||[]).forEach(h=>(byDeal[h.deal_id]??=[]).push(h));
 const newObs=(history||[]).filter(h=>Date.now()-new Date(h.recorded_at).getTime()<=7*86400000);
 const growth=[];
 Object.entries(byDeal).forEach(([id,rows])=>{
  if(rows.length<2)return;
  const newest=rows[0], older=rows[rows.length-1];
  if(Number.isFinite(Number(newest.price))&&Number.isFinite(Number(older.price))&&Number(older.price)!==0){
   const ch=(Number(newest.price)-Number(older.price))/Number(older.price)*100;
   if(Math.abs(ch)>=5)growth.push({id,ch,newest,older,field:"price"});
  }
  if(Number.isFinite(Number(newest.monthly_rent))&&Number.isFinite(Number(older.monthly_rent))&&Number(older.monthly_rent)!==0){
   const ch=(Number(newest.monthly_rent)-Number(older.monthly_rent))/Number(older.monthly_rent)*100;
   if(Math.abs(ch)>=5)growth.push({id,ch,newest,older,field:"rent"});
  }
 });
 const dealMap={}; (deals||[]).forEach(d=>dealMap[d.id]=d);
 const recentCards=newObs.slice(0,12).map(h=>{
  const d=dealMap[h.deal_id]; if(!d)return "";
  const name=d.property_address||d.name||"JGAP Property";
  return alertCard("New market observation",'<b>'+esc(name)+'</b> — '+esc(h.neighborhood||d.neighborhood||"Unassigned")+'<br>Price: <b>'+money(h.price)+'</b> · Rent: <b>'+money(h.monthly_rent)+'/mo</b>','Recorded '+new Date(h.recorded_at).toLocaleString(),"new");
 }).filter(Boolean);
 const growthCards=growth.slice(0,12).map(x=>{
  const d=dealMap[x.id],name=d?.property_address||d?.name||"JGAP Property";
  return alertCard((x.field==="price"?"Price movement":"Rent movement"),'<b>'+esc(name)+'</b> — '+(x.field==="price"?money(x.older.price)+" → "+money(x.newest.price):money(x.older.monthly_rent)+"/mo → "+money(x.newest.monthly_rent)+"/mo")+'<br>Observed change: <b>'+pct(x.ch)+'</b>','Based on recorded JGAP observations from '+new Date(x.older.recorded_at).toLocaleDateString()+" to "+new Date(x.newest.recorded_at).toLocaleDateString(),"growth");
 }).filter(Boolean);
 document.getElementById("jgapAlertsStatus").innerHTML=
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:14px 0">'+
  '<div class="panel" style="margin:0"><div class="muted">Recent observations</div><h2 style="margin:4px 0">'+newObs.length+'</h2><div class="muted">last 7 days</div></div>'+
  '<div class="panel" style="margin:0"><div class="muted">Growth signals</div><h2 style="margin:4px 0">'+growth.length+'</h2><div class="muted">5%+ observed movement</div></div>'+
  '<div class="panel" style="margin:0"><div class="muted">Properties with history</div><h2 style="margin:4px 0">'+Object.keys(byDeal).length+'</h2><div class="muted">recorded market history</div></div></div>'+
  '<h3>Automatic Alerts</h3><div style="display:grid;gap:10px">'+(automaticCards.length?automaticCards.join(""):'<div class="muted">No automatic alerts triggered right now.</div>')+'</div><div class="panel" style="margin:14px 0 22px;background:#fbfcfe"><b>Active rules</b><ul style="margin:8px 0 0 18px"><li>New multifamily property added to JGAP within the last 7 days.</li><li>Neighborhood multifamily rent increases of 8%+ with at least 365 days of recorded history.</li><li>New multifamily property whose neighborhood is showing that recorded rent-growth signal.</li></ul><div class="muted" style="margin-top:8px">Rules use recorded JGAP data only. No estimated or annualized short-term trends.</div></div><h3>Recent Market Activity</h3><div style="display:grid;gap:10px">'+(recentCards.length?recentCards.join(""):'<div class="muted">No observations recorded in the last 7 days.</div>')+'</div>'+
  '<h3 style="margin-top:22px">Growth Signals</h3><div style="display:grid;gap:10px">'+(growthCards.length?growthCards.join(""):'<div class="muted">No 5%+ recorded price or rent movement yet.</div>')+'</div>'+
  '<div class="panel" style="margin-top:22px;background:#f8fbff"><b>Phase 7 foundation</b><div class="muted" style="margin-top:5px">These are recorded-data alerts only. Listing-source alerts and radius-based alerts will be added in later Phase 7 steps. This rule uses JGAP neighborhood names until property coordinates are available.</div></div>';
};
})();
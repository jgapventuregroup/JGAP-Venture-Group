(function(){
"use strict";
function esc(v){return String(v??"").replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]});}
function money(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}):"—";}
function pct(v){const n=Number(v);return Number.isFinite(n)?(n>0?"+":"")+n.toFixed(1)+"%":"—";}
function alertCard(title,body,meta,kind){return '<div class="panel" style="margin:0"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h3 style="margin:0 0 6px">'+esc(title)+'</h3><div>'+body+'</div></div><span style="font-size:12px;padding:4px 8px;border-radius:999px;background:'+(kind==="growth"?"#eef8ef":"#eef5ff")+'">'+(kind==="growth"?"Growth":"New observation")+'</span></div><div class="muted" style="margin-top:8px;font-size:12px">'+esc(meta)+'</div></div>';}
window.renderAlertsPage=async function(){
 const app=document.getElementById("app"); if(!app)return;
 app.innerHTML='<div class="panel"><h2>🔔 Alerts</h2><p class="muted">JGAP Phase 7 — alerts based on recorded property and market activity.</p><div id="jgapAlertsStatus">Loading alerts…</div></div>';
 const [{data:deals,error:de},{data:history,error:he}]=await Promise.all([
  sb.from("deals").select("id,name,property_address,property_county,offer_state,property_type,status,asking_price,monthly_rent,units,neighborhood,created_at").order("created_at",{ascending:false}),
  sb.from("market_history").select("deal_id,recorded_at,price,monthly_rent,neighborhood").order("recorded_at",{ascending:false})
 ]);
 if(de||he){document.getElementById("jgapAlertsStatus").innerHTML='<div class="error">Could not load alert data.</div>';return;}
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
  const d=dealMap[x.id],name=d?.address||"JGAP Property";
  return alertCard((x.field==="price"?"Price movement":"Rent movement"),'<b>'+esc(name)+'</b> — '+(x.field==="price"?money(x.older.price)+" → "+money(x.newest.price):money(x.older.monthly_rent)+"/mo → "+money(x.newest.monthly_rent)+"/mo")+'<br>Observed change: <b>'+pct(x.ch)+'</b>','Based on recorded JGAP observations from '+new Date(x.older.recorded_at).toLocaleDateString()+" to "+new Date(x.newest.recorded_at).toLocaleDateString(),"growth");
 }).filter(Boolean);
 document.getElementById("jgapAlertsStatus").innerHTML=
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:14px 0">'+
  '<div class="panel" style="margin:0"><div class="muted">Recent observations</div><h2 style="margin:4px 0">'+newObs.length+'</h2><div class="muted">last 7 days</div></div>'+
  '<div class="panel" style="margin:0"><div class="muted">Growth signals</div><h2 style="margin:4px 0">'+growth.length+'</h2><div class="muted">5%+ observed movement</div></div>'+
  '<div class="panel" style="margin:0"><div class="muted">Properties with history</div><h2 style="margin:4px 0">'+Object.keys(byDeal).length+'</h2><div class="muted">recorded market history</div></div></div>'+
  '<h3>Recent Market Activity</h3><div style="display:grid;gap:10px">'+(recentCards.length?recentCards.join(""):'<div class="muted">No observations recorded in the last 7 days.</div>')+'</div>'+
  '<h3 style="margin-top:22px">Growth Signals</h3><div style="display:grid;gap:10px">'+(growthCards.length?growthCards.join(""):'<div class="muted">No 5%+ recorded price or rent movement yet.</div>')+'</div>'+
  '<div class="panel" style="margin-top:22px;background:#f8fbff"><b>Phase 7 foundation</b><div class="muted" style="margin-top:5px">These are recorded-data alerts only. Listing-source alerts, radius rules, and neighborhood-improvement triggers will be added in later Phase 7 steps.</div></div>';
};
})();
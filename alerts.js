(function(){
"use strict";

function esc(v){
  return String(v == null ? "" : v).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function money(v){
  var n=Number(v);
  return isFinite(n)?n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}):"—";
}
function pct(v){
  var n=Number(v);
  return isFinite(n)?(n>0?"+":"")+n.toFixed(1)+"%":"—";
}
function card(title,body,meta,kind){
  var bg=kind==="growth"?"#eef8ef":"#eef5ff";
  var tag=kind==="growth"?"Growth":"Alert";
  return '<div class="panel" style="margin:0"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h3 style="margin:0 0 6px">'+esc(title)+'</h3><div>'+body+'</div></div><span style="font-size:12px;padding:4px 8px;border-radius:999px;background:'+bg+'">'+tag+'</span></div><div class="muted" style="margin-top:8px;font-size:12px">'+esc(meta)+'</div></div>';
}
function daysAgo(v){
  var t=new Date(v).getTime();
  return isFinite(t)?Date.now()-t<=7*86400000:false;
}
function scoreRadar(r,minPrice,maxPrice){
  var score=0, reasons=[];
  var price=Number(r.asking_price), units=Number(r.units), cap=Number(r.cap_rate), dscr=Number(r.dscr);
  if(isFinite(cap)){if(cap>=8){score+=25;reasons.push("cap rate 8%+")}else if(cap>=6){score+=15;reasons.push("cap rate 6%+")}}
  if(isFinite(dscr)){if(dscr>=1.25){score+=20;reasons.push("DSCR 1.25+")}else if(dscr>=1.1){score+=10;reasons.push("DSCR 1.10+")}}
  if(isFinite(price)&&isFinite(units)&&units>0){
    var ppu=price/units;
    if(ppu<=100000){score+=20;reasons.push("≤ $100k/unit")}
    else if(ppu<=150000){score+=10;reasons.push("≤ $150k/unit")}
  }
  if(isFinite(price)&&minPrice!==null&&maxPrice!==null&&price>=minPrice&&price<=maxPrice){score+=15;reasons.push("inside JGAP price range")}
  if(String(r.source||"").trim()){score+=5;reasons.push("source identified")}
  return {score:score,reasons:reasons};
}

window.__jgapRadarAnalyzerQueue=window.__jgapRadarAnalyzerQueue||{};
window.openRadarInAnalyzer=function(id){
  var r=window.__jgapRadarAnalyzerQueue&&window.__jgapRadarAnalyzerQueue[id];
  if(!r){alert("That Deal Radar opportunity is no longer loaded. Refresh Alerts and try again.");return;}
  if(typeof window.renderDealAnalyzer!=="function"){alert("Deal Analyzer is not available yet. Please refresh JGAP and try again.");return;}
  var fullAddress=[r.address,[r.city,r.state,r.postal_code].filter(Boolean).join(", ")].filter(Boolean).join(", ");
  var notes=[r.source?r.source+" listing":"",r.source_url?r.source_url:""].filter(Boolean).join("\n");
  window.renderDealAnalyzer({status:"analyzing",name:r.name||r.address||"Deal Radar Opportunity",property_type:"multifamily",property_address:fullAddress,property_county:"",offer_state:r.state||"TN",purchase_price:r.asking_price,asking_price:r.asking_price,target_offer_price:null,units:r.units,monthly_rent:r.monthly_rent,monthly_operating_expenses:r.monthly_operating_expenses,vacancy_rate:r.vacancy_rate,notes:notes,source_url:r.source_url||"",source:r.source||""});
};

window.renderAlertsPage=function(){
  var app=document.getElementById("app");
  if(!app)return;
  app.innerHTML='<div class="pageHead"><div><h1>🔔 Alerts</h1><p class="muted">JGAP Phase 7 — recorded property and market activity.</p></div><div><button type="button" class="secondary" onclick="render()">← Dashboard</button></div></div><div class="panel"><div id="jgapAlertsStatus">Starting Alerts…</div></div>';

  function queryWithTimeout(query,label){
    return Promise.race([
      query,
      new Promise(function(_,reject){setTimeout(function(){reject(new Error(label+" timed out after 10 seconds"));},10000);})
    ]);
  }

  Promise.all([
    queryWithTimeout(sb.from("deals").select("id,name,property_address,property_county,offer_state,property_type,status,asking_price,monthly_rent,units,neighborhood,created_at").order("created_at",{ascending:false}).limit(500),"Deals query"),
    queryWithTimeout(sb.from("market_history").select("deal_id,recorded_at,price,monthly_rent,neighborhood").order("recorded_at",{ascending:false}).limit(1000),"Market history query"),
    queryWithTimeout(sb.from("radar_opportunities").select("id,name,source,source_url,property_type,address,city,state,postal_code,units,asking_price,cap_rate,dscr,status,first_seen_at,last_seen_at").eq("status","new").order("first_seen_at",{ascending:false}).limit(100),"Deal Radar query")
  ]).then(function(results){
    var deals=(results[0]&&results[0].data)||[];
    var history=(results[1]&&results[1].data)||[];
    var radar=(results[2]&&results[2].data)||[];
    var errors=[];
    if(results[0]&&results[0].error)errors.push("Deals query: "+results[0].error.message);
    if(results[1]&&results[1].error)errors.push("Market history query: "+results[1].error.message);
    if(results[2]&&results[2].error)errors.push("Deal Radar query: "+results[2].error.message);
    if(errors.length){
      document.getElementById("jgapAlertsStatus").innerHTML='<div class="error"><b>Could not load alert data.</b><div style="margin-top:8px;font-size:13px">'+esc(errors.join(" | "))+'</div></div>';
      return;
    }

    var now=Date.now();
    var newMultifamily=deals.filter(function(d){
      return String(d.property_type||"").toLowerCase()==="multifamily" && daysAgo(d.created_at);
    });

    var jgapStates=[];
    deals.forEach(function(d){
      var s=String(d.offer_state||"").trim().toUpperCase();
      if(s&&jgapStates.indexOf(s)===-1)jgapStates.push(s);
    });
    if(!jgapStates.length)jgapStates=["TN"];

    var multifamilyPrices=[];
    deals.forEach(function(d){
      if(String(d.property_type||"").toLowerCase()==="multifamily"&&Number(d.asking_price)>0)multifamilyPrices.push(Number(d.asking_price));
    });
    multifamilyPrices.sort(function(a,b){return a-b;});
    var observedMin=multifamilyPrices.length?multifamilyPrices[0]:null;
    var observedMax=multifamilyPrices.length?multifamilyPrices[multifamilyPrices.length-1]:null;

    var jgapCities=[];
    deals.forEach(function(d){
      if(String(d.property_type||"").toLowerCase()!=="multifamily")return;
      var parts=String(d.property_address||"").split(",");
      if(parts.length>=2){
        var city=String(parts[parts.length-2]).trim().toUpperCase();
        if(city&&jgapCities.indexOf(city)===-1)jgapCities.push(city);
      }
    });

    var centers={
      KINGSPORT:[36.548434,-82.561819],
      BRISTOL:[36.569135,-82.197489],
      "BLUFF CITY":[36.474271,-82.260969],
      "JOHNSON CITY":[36.313440,-82.353473],
      BLOUNTVILLE:[36.5337,-82.3268],
      ELIZABETHTON:[36.3487,-82.2107],
      GREENEVILLE:[36.1632,-82.8307],
      ROGERSVILLE:[36.4109,-82.9996],
      MORRISTOWN:[36.21398,-83.29489]
    };
    function distance(a,b){
      var R=3958.7613, rad=Math.PI/180;
      var dLat=(b[0]-a[0])*rad, dLon=(b[1]-a[1])*rad;
      var la1=a[0]*rad, la2=b[0]*rad;
      var h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)*Math.sin(dLon/2);
      return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
    }
    var targetCenters=[];
    jgapCities.forEach(function(c){if(centers[c])targetCenters.push(centers[c]);});

    var targetRadar=radar.filter(function(r){
      if(String(r.property_type||"").toLowerCase()!=="multifamily")return false;
      if(jgapStates.indexOf(String(r.state||"").trim().toUpperCase())===-1)return false;
      var city=String(r.city||"").trim().toUpperCase();
      if(!targetCenters.length)return jgapCities.indexOf(city)!==-1;
      if(centers[city]){
        for(var i=0;i<targetCenters.length;i++)if(distance(targetCenters[i],centers[city])<=50)return true;
      }
      return jgapCities.indexOf(city)!==-1;
    });

    targetRadar.forEach(function(r){
      window.__jgapRadarAnalyzerQueue[r.id]=r;
      var s=scoreRadar(r,observedMin,observedMax);
      r.radarScore=s.score;r.radarReasons=s.reasons;
    });
    targetRadar.sort(function(a,b){return b.radarScore-a.radarScore;});

    var byNeighborhood={};
    history.forEach(function(h){
      var n=String(h.neighborhood||"").trim();
      if(n){if(!byNeighborhood[n])byNeighborhood[n]=[];byNeighborhood[n].push(h);}
    });
    var neighborhoodAlerts=[];
    Object.keys(byNeighborhood).forEach(function(n){
      var rows=byNeighborhood[n].slice().sort(function(a,b){return new Date(a.recorded_at)-new Date(b.recorded_at);});
      if(rows.length<2)return;
      var first=rows[0],latest=rows[rows.length-1];
      var days=(new Date(latest.recorded_at)-new Date(first.recorded_at))/86400000;
      if(days<365)return;
      var oldRent=Number(first.monthly_rent),newRent=Number(latest.monthly_rent);
      if(isFinite(oldRent)&&oldRent!==0&&isFinite(newRent)){
        var change=(newRent-oldRent)/oldRent*100;
        if(change>=8)neighborhoodAlerts.push({n:n,change:change});
      }
    });

    var automatic=[];
    targetRadar.slice(0,12).forEach(function(r){
      var loc=[r.city,r.state,r.postal_code].filter(Boolean).join(", ")||r.address||"Location not provided";
      automatic.push(card("📡 New Deal Radar opportunity",'<b>'+esc(r.name||r.address||"Multifamily opportunity")+'</b><br>'+esc(loc)+(r.units!=null?" · Units: <b>"+esc(r.units)+"</b>":"")+" · Asking price: <b>"+money(r.asking_price)+"</b><div style="margin-top:10px"><button type="button" class="primary" onclick="openRadarInAnalyzer(\''+r.id+'\')">Analyze in Deal Analyzer</button>'+(r.source_url?'<a class="secondary" target="_blank" rel="noopener" href="'+esc(r.source_url)+'">Open Listing</a>':"")+'</div>","Score "+r.radarScore+"/100 · "+(r.radarReasons.length?r.radarReasons.join(" · "):"No strong recorded signal yet"),"new"));
    });
    newMultifamily.slice(0,12).forEach(function(d){
      window.__jgapRadarAnalyzerQueue["deal:"+d.id]=d;
      automatic.push(card("🔔 New multifamily property",'<b>'+esc(d.property_address||d.name||"JGAP Property")+'</b><br>Asking price: <b>'+money(d.asking_price)+'</b> · Status: <b>'+esc(d.status||"—")+'</b><div style="margin-top:10px"><button type="button" class="primary" onclick="openRadarInAnalyzer(\'deal:'+d.id+'\')">Analyze in Deal Analyzer</button></div>','Added to JGAP '+new Date(d.created_at).toLocaleString(),"new"));
    });
    neighborhoodAlerts.slice(0,12).forEach(function(x){
      automatic.push(card("📈 Neighborhood rent growth",'<b>'+esc(x.n)+'</b><br>Observed rent change: <b>'+pct(x.change)+'</b>','At least 365 days of recorded JGAP history',"growth"));
    });

    var radarPriority=targetRadar.slice(0,12).map(function(r){
      var label=r.radarScore>=70?"High attention":r.radarScore>=45?"Review":"Monitor";
      return card("⭐ "+r.radarScore+"/100 — "+label,'<b>'+esc(r.name||r.address||"Opportunity")+'</b><br>'+esc([r.city,r.state].filter(Boolean).join(", ")||"Location not provided")+' · Asking: <b>'+money(r.asking_price)+'</b>','Signals: '+(r.radarReasons.length?r.radarReasons.join(" · "):"No strong recorded signal yet"),"new");
    });

    var newObs=history.filter(function(h){return now-new Date(h.recorded_at).getTime()<=7*86400000;});
    var byDeal={};
    history.forEach(function(h){if(!byDeal[h.deal_id])byDeal[h.deal_id]=[];byDeal[h.deal_id].push(h);});
    var dealMap={};
    deals.forEach(function(d){dealMap[d.id]=d;});
    var recentCards=newObs.slice(0,12).map(function(h){
      var d=dealMap[h.deal_id];if(!d)return "";
      return card("New market observation",'<b>'+esc(d.property_address||d.name||"JGAP Property")+'</b><br>Price: <b>'+money(h.price)+'</b> · Rent: <b>'+money(h.monthly_rent)+'/mo</b>','Recorded '+new Date(h.recorded_at).toLocaleString(),"new");
    }).filter(Boolean);

    var growth=[];
    Object.keys(byDeal).forEach(function(id){
      var rows=byDeal[id].slice().sort(function(a,b){return new Date(a.recorded_at)-new Date(b.recorded_at);});
      if(rows.length<2)return;
      var old=rows[0],latest=rows[rows.length-1];
      if(Number(old.price)!==0&&isFinite(Number(old.price))&&isFinite(Number(latest.price))){
        var pc=(Number(latest.price)-Number(old.price))/Number(old.price)*100;
        if(Math.abs(pc)>=5)growth.push({id:id,change:pc,field:"price"});
      }
      if(Number(old.monthly_rent)!==0&&isFinite(Number(old.monthly_rent))&&isFinite(Number(latest.monthly_rent))){
        var rc=(Number(latest.monthly_rent)-Number(old.monthly_rent))/Number(old.monthly_rent)*100;
        if(Math.abs(rc)>=5)growth.push({id:id,change:rc,field:"rent"});
      }
    });
    var growthCards=growth.slice(0,12).map(function(x){
      var d=dealMap[x.id];
      return card(x.field==="price"?"Price movement":"Rent movement",'<b>'+esc(d?(d.property_address||d.name):"JGAP Property")+'</b><br>Observed change: <b>'+pct(x.change)+'</b>','Recorded JGAP history',"growth");
    });

    var status=document.getElementById("jgapAlertsStatus");
    if(!status)return;
    status.innerHTML=
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:14px 0">'+
      '<div class="panel" style="margin:0"><div class="muted">Radar targets</div><h2 style="margin:4px 0">'+targetRadar.length+'</h2><div class="muted">current matches</div></div>'+
      '<div class="panel" style="margin:0"><div class="muted">Recent observations</div><h2 style="margin:4px 0">'+newObs.length+'</h2><div class="muted">last 7 days</div></div>'+
      '<div class="panel" style="margin:0"><div class="muted">Growth signals</div><h2 style="margin:4px 0">'+growth.length+'</h2><div class="muted">5%+ movement</div></div></div>'+
      '<h3>Deal Radar Priority</h3><div style="display:grid;gap:10px">'+(radarPriority.length?radarPriority.join(""):'<div class="muted">No scored target opportunities right now.</div>')+'</div>'+
      '<h3>Automatic Alerts</h3><div style="display:grid;gap:10px">'+(automatic.length?automatic.join(""):'<div class="muted">No automatic alerts triggered right now.</div>')+'</div>'+
      '<div class="panel" style="margin:14px 0 22px;background:#fbfcfe"><b>Active rules</b><ul style="margin:8px 0 0 18px"><li>Multifamily Deal Radar within the configured 50-mile starting market radius.</li><li>Transparent priority scoring from recorded asking price, units, cap rate, DSCR, and JGAP price history.</li><li>New multifamily properties added to JGAP within 7 days.</li><li>Neighborhood rent growth of 8%+ with at least 365 days of recorded history.</li></ul><div class="muted" style="margin-top:8px">No estimated or annualized short-term trends are used.</div></div>'+
      '<h3>Recent Market Activity</h3><div style="display:grid;gap:10px">'+(recentCards.length?recentCards.join(""):'<div class="muted">No observations recorded in the last 7 days.</div>')+'</div>'+
      '<h3 style="margin-top:22px">Growth Signals</h3><div style="display:grid;gap:10px">'+(growthCards.length?growthCards.join(""):'<div class="muted">No 5%+ recorded price or rent movement yet.</div>')+'</div>';
  }).catch(function(e){
    var status=document.getElementById("jgapAlertsStatus");
    if(status)status.innerHTML='<div class="error"><b>Could not load alert data.</b><div style="margin-top:8px;font-size:13px">'+esc(e.message||String(e))+'</div></div>';
  });
};

})();
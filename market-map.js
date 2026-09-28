/* JGAP Market Map — Phase 4: Market History
   Purpose: a safe, separate map view connected to existing deal records.
   No schema changes. No changes to Deal Analyzer or Deal Pipeline logic.
*/
(function(){
  const LEAFLET_CSS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  const LEAFLET_JS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  const CITY_FALLBACKS={
    'bristol, tn':[36.595,-82.188],
    'bristol, va':[36.611,-82.179],
    'kingsport, tn':[36.548,-82.562],
    'johnson city, tn':[36.313,-82.353],
    'bluff city, tn':[36.474,-82.260],
    'gray, tn':[36.418,-82.477],
    'elizabethon, tn':[36.349,-82.211],
    'elizabethton, tn':[36.349,-82.211]
  };
  let map=null;
  let markers=[];
  let allRows=[];
  let leafletPromise=null;
  let marketHistoryByDeal={};

  function loadLeaflet(){
    if(window.L) return Promise.resolve(window.L);
    if(leafletPromise) return leafletPromise;
    leafletPromise=new Promise((resolve,reject)=>{
      if(!document.getElementById('jgap-leaflet-css')){
        const css=document.createElement('link');
        css.id='jgap-leaflet-css';css.rel='stylesheet';css.href=LEAFLET_CSS;
        document.head.appendChild(css);
      }
      const script=document.createElement('script');
      script.src=LEAFLET_JS;
      script.onload=()=>window.L?resolve(window.L):reject(new Error('Map library did not load.'));
      script.onerror=()=>reject(new Error('Map library could not load. Check your internet connection and refresh.'));
      document.head.appendChild(script);
    });
    return leafletPromise;
  }

  function money(v){
    const n=Number(v||0);
    if(!Number.isFinite(n)||n<=0)return '—';
    return '$'+n.toLocaleString(undefined,{maximumFractionDigits:0});
  }
  function esc(v){return escapeHtml(String(v??''));}
  function rowText(r){return [r.name,r.property_address,r.property_type,r.status,r.neighborhood].map(v=>String(v||'').toLowerCase()).join(' ');}
  function normalizedStatus(r){return String(r.status||'').toLowerCase()==='closed'?'sold':'for_sale';}
  function neighborhoodFor(r){if(r.neighborhood)return String(r.neighborhood).trim();const a=String(r.property_address||'').toLowerCase();if(a.includes('kingsport'))return 'Kingsport';if(a.includes('bristol'))return 'Bristol';if(a.includes('bluff city'))return 'Bluff City';if(a.includes('johnson city'))return 'Johnson City';if(a.includes('gray'))return 'Gray';if(a.includes('elizabet'))return 'Elizabethton';return 'Other';}
  function statusLabel(s){return String(s||'lead').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());}

  function injectStyles(){
    if(document.getElementById('jgap-market-map-styles'))return;
    const style=document.createElement('style');
    style.id='jgap-market-map-styles';
    style.textContent=`
      .marketMapWrap{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:16px}
      .marketMapCanvas{height:620px;border:1px solid #dfe5ed;border-radius:14px;overflow:hidden;background:#eef2f6}
      .marketMapSide{max-height:620px;overflow:auto}
      .marketMapPin{width:18px;height:18px;border-radius:50%;border:3px solid #fff;background:#1f6feb;box-shadow:0 1px 5px #17203355}
      .marketMapCard{border:1px solid #e2e7ef;border-radius:12px;padding:12px;margin-bottom:9px;background:#fff;cursor:pointer}
      .marketMapCard:hover{border-color:#9db8df}
      .marketMapCard.selected{border:2px solid #1f6feb;padding:11px}
      .marketMapLegend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#667085;margin-top:10px}
      .marketMapLegend span{display:inline-flex;align-items:center;gap:6px}
      .marketMapDot{width:10px;height:10px;border-radius:50%;display:inline-block}\n      .marketIntelBox{border:1px solid #e2e7ef;border-radius:10px;padding:12px;background:#fbfcfe}
      .marketHistoryTable{width:100%;border-collapse:collapse;font-size:12px}.marketHistoryTable th,.marketHistoryTable td{padding:7px;border-top:1px solid #eef1f5;text-align:left;vertical-align:top}.marketHistoryTable th{color:#667085;font-weight:600}
      .marketNeighborhoodTable{width:100%;border-collapse:collapse;font-size:12px}.marketNeighborhoodTable th,.marketNeighborhoodTable td{padding:8px;border-top:1px solid #eef1f5;text-align:left;vertical-align:top;white-space:nowrap}.marketNeighborhoodTable th{color:#667085;font-weight:600}
      .marketNeighborhoodTable td.num{text-align:right}
      .marketGrowthTable{width:100%;border-collapse:collapse;font-size:12px}.marketGrowthTable th,.marketGrowthTable td{padding:8px;border-top:1px solid #eef1f5;text-align:left;vertical-align:top;white-space:nowrap}.marketGrowthTable th{color:#667085;font-weight:600}.marketGrowthTable td.num{text-align:right}.marketGrowthUp,.marketGrowthDown,.marketGrowthFlat{font-weight:700}
      @media(max-width:950px){.marketMapWrap{grid-template-columns:1fr}.marketMapSide{max-height:none}.marketMapCanvas{height:480px}}
    `;
    document.head.appendChild(style);
  }

  function addressFor(r){
    return r.property_address || r.address || r.name || '';
  }
  function cityFor(r){
    const a=String(addressFor(r)).toLowerCase();
    if(a.includes('kingsport'))return 'kingsport, tn';
    if(a.includes('bristol') && /va\b|virginia/i.test(a))return 'bristol, va';
    if(a.includes('bluff city'))return 'bluff city, tn';
    if(a.includes('johnson city'))return 'johnson city, tn';
    if(a.includes('gray'))return 'gray, tn';
    if(a.includes('elizabet'))return 'elizabethon, tn';
    return 'bristol, tn';
  }
  async function geocodeAddress(address){
    const key='jgap_market_geocode_'+address.toLowerCase().trim();
    try{
      const cached=JSON.parse(localStorage.getItem(key)||'null');
      if(cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lon))return {...cached,cached:true};
    }catch(e){}
    try{
      const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q='+encodeURIComponent(address+', Tennessee, USA');
      const res=await fetch(url,{headers:{'Accept':'application/json'}});
      if(res.ok){
        const data=await res.json();
        if(data&&data[0]){
          const point={lat:Number(data[0].lat),lon:Number(data[0].lon)};
          if(Number.isFinite(point.lat)&&Number.isFinite(point.lon)){
            try{localStorage.setItem(key,JSON.stringify(point));}catch(e){}
            return point;
          }
        }
      }
    }catch(e){}
    const fallback=CITY_FALLBACKS[cityFor({property_address:address})]||CITY_FALLBACKS['bristol, tn'];
    return {lat:fallback[0],lon:fallback[1],approximate:true};
  }

  async function placeRows(rows){
    if(!map)return;
    markers.forEach(m=>m.remove());
    markers=[];
    const bounds=[];
    for(const r of rows){
      const address=addressFor(r);
      const point=await geocodeAddress(address);
      const marker=L.circleMarker([point.lat,point.lon],{
        radius:8,weight:2,color:'#fff',fillColor:'#1f6feb',fillOpacity:.9
      }).addTo(map);
      const popup='<b>'+esc(r.name||address||'JGAP Deal')+'</b><br>'+
        esc(address||'')+'<br>'+
        'Asking: '+money(r.asking_price)+'<br>'+
        'Type: '+esc(r.property_type||'Not entered')+'<br>'+
        'Status: '+esc(statusLabel(r.status))+
        (point.approximate?'<br><span style="color:#667085;font-size:12px">Approximate city location</span>':'');
      marker.bindPopup(popup);
      marker.on('click',()=>selectRow(r.id,true));
      markers.push(marker);
      bounds.push([point.lat,point.lon]);
    }
    if(bounds.length){
      map.fitBounds(bounds,{padding:[30,30],maxZoom:13});
    }else{
      map.setView(CITY_FALLBACKS['bristol, tn'],11);
    }
  }

  function renderRows(){
    const host=document.getElementById('marketMapList');
    if(!host)return;
    const q=(document.getElementById('marketMapSearch')?.value||'').toLowerCase().trim();
    const type=(document.getElementById('marketMapType')?.value||'').toLowerCase();
    const status=(document.getElementById('marketMapStatus')?.value||'').toLowerCase();
    const neighborhood=(document.getElementById('marketMapNeighborhood')?.value||'').toLowerCase();
    const minPrice=Number(document.getElementById('marketMapMinPrice')?.value||0), maxPrice=Number(document.getElementById('marketMapMaxPrice')?.value||0);
    const minUnits=Number(document.getElementById('marketMapMinUnits')?.value||0), maxUnits=Number(document.getElementById('marketMapMaxUnits')?.value||0);
    const rows=allRows.filter(r=>{
      const text=rowText(r);
      const isType=!type || String(r.property_type||'').toLowerCase().includes(type);
      const isStatus=!status || normalizedStatus(r)===status;
      const n=Number(r.asking_price||r.purchase_price||0), u=Number(r.units||0);
      const isNeighborhood=!neighborhood || neighborhoodFor(r).toLowerCase()===neighborhood;
      const isPrice=(!minPrice&&!maxPrice)||(n>0&&(!minPrice||n>=minPrice)&&(!maxPrice||n<=maxPrice));
      const isUnits=(!minUnits&&!maxUnits)||(u>0&&(!minUnits||u>=minUnits)&&(!maxUnits||u<=maxUnits));
      return (!q||text.includes(q))&&isType&&isStatus&&isNeighborhood&&isPrice&&isUnits;
    });
    const count=document.getElementById('marketMapCount');
    if(count)count.textContent=rows.length+' deal'+(rows.length===1?'':'s')+' shown';
    if(!rows.length){
      host.innerHTML='<div class="card"><b>No matching JGAP deals.</b><p class="muted">Change the filters or add a property to the Deal Pipeline.</p></div>';
      return;
    }
    host.innerHTML=rows.map(r=>{
      const selected=window.__jgapMarketMapSelectedId===r.id?' selected':'';
      return '<div class="marketMapCard'+selected+'" data-market-id="'+esc(r.id)+'">'+
        '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">'+
        '<div><b>'+esc(r.name||r.property_address||'Untitled Deal')+'</b><div class="muted" style="font-size:12px;margin-top:3px">'+esc(r.property_address||'Address not entered')+'</div></div>'+
        '<span class="pill">'+esc(statusLabel(r.status))+'</span></div>'+
        '<div class="stats" style="grid-template-columns:1fr 1fr;margin-top:9px">'+
        '<div><span>Asking</span><b style="font-size:16px">'+money(r.asking_price)+'</b></div>'+
        '<div><span>JGAP Target</span><b style="font-size:16px">'+money(r.target_offer_price)+'</b></div></div></div>';
    }).join('');
    host.querySelectorAll('[data-market-id]').forEach(el=>el.addEventListener('click',()=>selectRow(el.dataset.marketId,false)));
    renderSelectedDetails();
  }

  function renderNeighborhoodAnalysis(){
    const host=document.getElementById('marketNeighborhoodAnalysis');
    if(!host)return;
    const groups={};
    allRows.filter(r=>String(r.property_type||'').toLowerCase().includes('multifamily') || Number(r.monthly_rent||0)>0).forEach(r=>{
      const n=neighborhoodFor(r)||'Other';
      if(!groups[n])groups[n]={name:n,total:0,forSale:0,sold:0,asking:[],soldPrices:[],rents:[]};
      const g=groups[n];
      g.total++;
      if(normalizedStatus(r)==='sold'){
        g.sold++;
        const soldPrice=Number(r.purchase_price||0);
        if(soldPrice>0)g.soldPrices.push(soldPrice);
      }else{
        g.forSale++;
        const asking=Number(r.asking_price||0);
        if(asking>0)g.asking.push(asking);
      }
      const rent=Number(r.monthly_rent||0);
      if(rent>0)g.rents.push(rent);
    });
    const rows=Object.values(groups).sort((a,b)=>a.name.localeCompare(b.name));
    const avg=a=>a.length?a.reduce((sum,v)=>sum+v,0)/a.length:0;
    const moneyCell=a=>a.length?money(avg(a)):'—';
    host.innerHTML=rows.length
      ? '<div style="overflow:auto"><table class="marketNeighborhoodTable"><thead><tr><th>Neighborhood</th><th>Tracked</th><th>For Sale</th><th>Sold</th><th>Avg Asking</th><th>Avg Sold Price</th><th>Avg Monthly Rent</th></tr></thead><tbody>'+
        rows.map(g=>'<tr><td><b>'+esc(g.name)+'</b></td><td class="num">'+g.total+'</td><td class="num">'+g.forSale+'</td><td class="num">'+g.sold+'</td><td class="num">'+moneyCell(g.asking)+'</td><td class="num">'+moneyCell(g.soldPrices)+'</td><td class="num">'+moneyCell(g.rents)+'</td></tr>').join('')+
        '</tbody></table></div>'
      : '<div class="muted">Not enough entered multifamily data to calculate neighborhood statistics yet.</div>';
  }

  async function loadMarketGrowth(){
    const host=document.getElementById('marketGrowthTracking'); if(!host)return;
    host.innerHTML='<div class="muted">Loading growth history…</div>';
    const {data,error}=await sb.from('market_history').select('deal_id,recorded_at,price,monthly_rent,neighborhood,created_at').order('recorded_at',{ascending:true});
    if(error){console.error('JGAP Market Growth load failed:',error);host.innerHTML='<div class="error">Growth history could not be loaded: '+esc(error.message||'database error')+'</div>';return;}
    const byDeal={};
    (data||[]).forEach(h=>{const a=new Date(h.recorded_at).getTime(),b=new Date(h.created_at).getTime();if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>300000)return;(byDeal[h.deal_id]||(byDeal[h.deal_id]=[])).push(h);});
    const groups={};
    Object.values(byDeal).forEach(h=>{if(h.length<2)return;const first=h[0],last=h[h.length-1],n=String(last.neighborhood||first.neighborhood||'Other').trim()||'Other';if(!groups[n])groups[n]={name:n,properties:0,snapshots:0,prices:[],rents:[]};const g=groups[n];g.properties++;g.snapshots+=h.length;const fp=Number(first.price||0),lp=Number(last.price||0),fr=Number(first.monthly_rent||0),lr=Number(last.monthly_rent||0);if(fp>0&&lp>0)g.prices.push((lp-fp)/fp*100);if(fr>0&&lr>0)g.rents.push((lr-fr)/fr*100);});
    const real=Object.values(byDeal).reduce((s,h)=>s+h.length,0),rows=Object.values(groups).sort((a,b)=>a.name.localeCompare(b.name)),avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null,pct=v=>v===null?'—':(v>0?'+':'')+v.toFixed(1)+'%';
    const direction=(p,r)=>{const v=[p,r].filter(x=>x!==null);if(!v.length)return '<span class="marketGrowthFlat">Building history</span>';const a=v.reduce((s,x)=>s+x,0)/v.length;return a>.5?'<span class="marketGrowthUp">↑ Increasing</span>':a<-.5?'<span class="marketGrowthDown">↓ Decreasing</span>':'<span class="marketGrowthFlat">→ Stable</span>';};
    const propertyRows=allRows.filter(r=>String(r.property_type||'').toLowerCase().includes('multifamily')||Number(r.monthly_rent||0)>0).slice(0,12);
    const recordList=propertyRows.length?'<div style="margin-top:12px"><b style="font-size:13px">Record a snapshot</b><div class="muted" style="font-size:12px;margin:4px 0 8px">Choose a tracked property. Its current price, rent, status, units, and neighborhood will be ready to record.</div>'+propertyRows.map(r=>'<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-top:1px solid #eef1f5"><span><b>'+esc(r.name||r.property_address||'JGAP Deal')+'</b><br><span class="muted" style="font-size:11px">'+esc(r.property_address||'Address not entered')+'</span></span><button class="secondary" type="button" style="margin:0" onclick="selectRow(\''+String(r.id).replace(/'/g,"\\'")+'\',false)">Record Snapshot</button></div>').join('')+'</div>':'<div class="muted" style="margin-top:10px">No tracked properties are available yet.</div>';
    if(!real){host.innerHTML='<div class="muted">Growth tracking is ready. Use the buttons below to select a tracked property and record its first snapshot. JGAP will calculate growth after a second observation.</div>'+recordList;return;}
    if(!rows.length){host.innerHTML='<div class="muted">'+real+' real market snapshot'+(real===1?'':'s')+' recorded, but no property has two observations yet. Select a property below and record another snapshot later to establish a growth trend.</div>'+recordList;return;}
    host.innerHTML='<div class="muted" style="font-size:12px;margin-bottom:8px">Growth uses properties with at least two user-recorded snapshots. Initial seeded snapshots are excluded.</div><div style="overflow:auto"><table class="marketGrowthTable"><thead><tr><th>Neighborhood</th><th>Properties with History</th><th>Snapshots</th><th>Price Change</th><th>Rent Change</th><th>Direction</th></tr></thead><tbody>'+rows.map(g=>{const p=avg(g.prices),r=avg(g.rents);return '<tr><td><b>'+esc(g.name)+'</b></td><td class="num">'+g.properties+'</td><td class="num">'+g.snapshots+'</td><td class="num">'+pct(p)+'</td><td class="num">'+pct(r)+'</td><td>'+direction(p,r)+'</td></tr>';}).join('')+'</tbody></table></div>'+recordList;
  }

  function distanceMiles(a,b){
    const R=3958.7613, p=Math.PI/180;
    const dLat=(b.lat-a.lat)*p, dLon=(b.lon-a.lon)*p;
    const x=Math.sin(dLat/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(x));
  }
  function researchKey(id){return 'jgap_market_research_'+String(id||'');}
  function loadResearch(id){try{return JSON.parse(localStorage.getItem(researchKey(id))||'{}')||{};}catch(e){return {};}}
  function saveResearch(id){
    const summary=document.getElementById('marketResearchSummary')?.value||'';
    const verify=[...document.querySelectorAll('[data-research-check]')].map(x=>({k:x.dataset.researchCheck,done:x.checked}));
    try{localStorage.setItem(researchKey(id),JSON.stringify({summary,verify,updated_at:new Date().toISOString()}));const s=document.getElementById('marketResearchSaveStatus');if(s)s.textContent='Research saved '+new Date().toLocaleTimeString();}
    catch(e){const s=document.getElementById('marketResearchSaveStatus');if(s)s.textContent='Could not save research in this browser.';}
  }
  function addressQuery(row){return encodeURIComponent((row.property_address||row.name||'')+', Tennessee');}
  function searchUrl(base,row){return base+addressQuery(row);}
  async function loadMarketHistory(dealId){
    if(!dealId){marketHistoryByDeal={};return;}
    const {data,error}=await sb.from('market_history').select('id,recorded_at,price,monthly_rent,status,units,neighborhood').eq('deal_id',dealId).order('recorded_at',{ascending:false});
    if(error){console.error('JGAP Market History load failed:',error);marketHistoryByDeal[dealId]=[];return;}
    marketHistoryByDeal[dealId]=data||[];
  }
  function renderHistoryBlock(row){
    const history=marketHistoryByDeal[row.id]||[];
    const rows=history.map(h=>'<tr><td>'+esc(new Date(h.recorded_at).toLocaleDateString())+'</td><td>'+money(h.price)+'</td><td>'+money(h.monthly_rent)+'</td><td>'+esc(statusLabel(h.status))+'</td><td>'+esc(h.units??'—')+'</td><td>'+esc(h.neighborhood||'—')+'</td></tr>').join('');
    const rawStatus=String(row.status||'lead').toLowerCase();
    const statusValue=rawStatus==='closed'?'closed':(['lead','analyzing','archived'].includes(rawStatus)?rawStatus:'lead');
    const statusOptions=['lead','analyzing','closed','archived'].map(v=>'<option value="'+v+'"'+(v===statusValue?' selected':'')+'>'+({lead:'Lead',analyzing:'Analyzing',closed:'Closed / Sold',archived:'Archived'}[v])+'</option>').join('');
    return '<div class="marketIntelBox" style="margin-top:12px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap"><div><b>Market History</b><div class="muted" style="font-size:12px;margin-top:3px">Record the price, monthly rent, status, units, and neighborhood as the market changes. JGAP also captures future tracked deal changes automatically.</div></div><span class="pill">'+history.length+' snapshot'+(history.length===1?'':'s')+'</span></div>'+
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px"><label style="font-size:12px">Price<input id="marketHistoryPrice" type="number" min="0" value="'+esc(row.asking_price||row.purchase_price||'')+'"></label><label style="font-size:12px">Monthly Rent<input id="marketHistoryRent" type="number" min="0" value="'+esc(row.monthly_rent||'')+'"></label><label style="font-size:12px">Status<select id="marketHistoryStatus">'+statusOptions+'</select></label><label style="font-size:12px">Units<input id="marketHistoryUnits" type="number" min="0" value="'+esc(row.units||'')+'"></label></div>'+
      '<div style="display:flex;gap:8px;align-items:end;margin-top:8px;flex-wrap:wrap"><label style="font-size:12px;flex:1;min-width:180px">Neighborhood<input id="marketHistoryNeighborhood" value="'+esc(neighborhoodFor(row))+'"></label><button class="primary" type="button" onclick="recordMarketSnapshot()">Record Snapshot</button><span id="marketHistorySaveStatus" class="muted" style="font-size:11px"></span></div>'+
      '<div style="overflow:auto;margin-top:10px"><table class="marketHistoryTable"><thead><tr><th>Date</th><th>Price</th><th>Rent</th><th>Status</th><th>Units</th><th>Neighborhood</th></tr></thead><tbody>'+ (rows||'<tr><td colspan="6" class="muted">No market snapshots recorded yet.</td></tr>')+'</tbody></table></div></div>';
  }
  window.recordMarketSnapshot=async function(){
    const dealId=window.__jgapMarketMapSelectedId, row=allRows.find(r=>r.id===dealId); if(!row)return;
    const status=document.getElementById('marketHistoryStatus')?.value||row.status||'lead';
    const payload={company_id:row.company_id,deal_id:dealId,price:Number(document.getElementById('marketHistoryPrice')?.value||0)||null,monthly_rent:Number(document.getElementById('marketHistoryRent')?.value||0)||null,status,units:Number(document.getElementById('marketHistoryUnits')?.value||0)||null,neighborhood:(document.getElementById('marketHistoryNeighborhood')?.value||'').trim()||null};
    if(!payload.company_id){const s=document.getElementById('marketHistorySaveStatus');if(s)s.textContent='Company could not be identified.';return;}
    const s=document.getElementById('marketHistorySaveStatus'); if(s)s.textContent='Saving…';
    const {error}=await sb.from('market_history').insert(payload);
    if(error){console.error(error);if(s)s.textContent='Could not save snapshot: '+(error.message||'database error');return;}
    await loadMarketHistory(dealId); renderSelectedDetails();
  };
  function renderSelectedDetails(){
    const host=document.getElementById('marketMapSelectedDetails'); if(!host)return;
    const row=allRows.find(r=>r.id===window.__jgapMarketMapSelectedId);
    if(!row){host.innerHTML='<div class="muted">Select a property on the map or list to unlock its location intelligence.</div>';return;}
    const purchase=Number(row.purchase_price||0),asking=Number(row.asking_price||0),target=Number(row.target_offer_price||0);
    const gap=(asking>0&&target>0)?asking-target:null, research=loadResearch(row.id), p=window.__jgapMarketMapSelectedPoint;
    const nearby=(p&&Number.isFinite(p.lat)?(window.__jgapMarketMapPoints||[]).filter(x=>x.id!==row.id&&Number.isFinite(x.lat)).map(x=>({...x,distance:distanceMiles(p,x)}).filter?null:null):null);
    const nearbyRows=(p&&Number.isFinite(p.lat)?(window.__jgapMarketMapPoints||[]).filter(x=>x.id!==row.id&&Number.isFinite(x.lat)&&Number.isFinite(x.lon)).map(x=>({...x,distance:distanceMiles(p,x)})).filter(x=>x.distance<=5).sort((a,b)=>a.distance-b.distance).slice(0,8):[]);
    const compSearch={property_address:(row.property_address||'')+' comparable sales'};
    const rentSearch={property_address:(row.property_address||'')+' apartments rents'};
    host.innerHTML=
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><b style="font-size:17px">'+esc(row.name||'JGAP Deal')+'</b><div class="muted" style="margin-top:3px">'+esc(row.property_address||'Address not entered')+'</div></div><span class="pill">Location Intelligence</span></div>'+
      '<div class="stats" style="grid-template-columns:repeat(4,1fr);margin-top:14px"><div><span>Asking</span><b>'+money(asking)+'</b></div><div><span>JGAP Target</span><b>'+money(target)+'</b></div><div><span>Purchase</span><b>'+money(purchase)+'</b></div><div><span>Type</span><b style="font-size:14px">'+esc(row.property_type||'Not entered')+'</b></div></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">'+
      '<div class="marketIntelBox"><b>Nearby JGAP properties</b><div class="muted" style="font-size:12px;margin:4px 0 8px">Existing Pipeline deals within 5 miles.</div>'+(nearbyRows.length?nearbyRows.map(x=>'<div style="display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid #eef1f5"><span><b>'+esc(x.name||x.address||'JGAP Deal')+'</b><br><span class="muted" style="font-size:11px">'+esc(x.address||'')+'</span></span><span class="pill">'+x.distance.toFixed(1)+' mi</span></div>').join(''):'<div class="muted">No other mapped JGAP deals within 5 miles.</div>')+'</div>'+
      '<div class="marketIntelBox"><b>Property-specific research</b><div class="muted" style="font-size:12px;margin:4px 0 8px">External research stays outside underwriting until you verify it.</div><div class="toolbar"><a class="secondary" target="_blank" rel="noopener" href="'+searchUrl('https://www.google.com/search?q=',row)+'">Web research</a><a class="secondary" target="_blank" rel="noopener" href="'+searchUrl('https://www.google.com/search?q=',compSearch)+'">Comparable sales</a><a class="secondary" target="_blank" rel="noopener" href="'+searchUrl('https://www.google.com/search?q=',rentSearch)+'">Rent research</a></div></div></div>'+
      '<div class="marketIntelBox" style="margin-top:12px"><b>Important items to verify</b><div class="muted" style="font-size:12px;margin:4px 0 8px">Check these before using outside research in a deal decision.</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'+
      ['Exact parcel/address','Zoning and permitted use','Unit count / legal status','Recent comparable sales','Current market rents','Property taxes / assessments','Flood zone / site constraints','Major nearby development'].map((label,n)=>{const k='c'+n,done=(research.verify||[]).find(x=>x.k===k)?.done?' checked':'';return '<label style="font-size:12px;display:flex;gap:7px;align-items:flex-start"><input type="checkbox" data-research-check="'+k+'"'+done+' style="width:auto;margin:2px 0 0"> '+esc(label)+'</label>';}).join('')+'</div></div>'+
      '<div class="marketIntelBox" style="margin-top:12px"><b>Research summary</b><div class="muted" style="font-size:12px;margin:4px 0 7px">Short notes about location, comps, rents, zoning, development, and risks. Saved only in this browser.</div><textarea id="marketResearchSummary" placeholder="What did you learn about this location and market?" style="width:100%;min-height:110px;padding:10px;border:1px solid #ccd5e2;border-radius:9px;resize:vertical">'+esc(research.summary||'')+'</textarea><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:8px"><span id="marketResearchSaveStatus" class="muted" style="font-size:11px">'+(research.updated_at?'Last saved '+new Date(research.updated_at).toLocaleString():'Not saved yet')+'</span><button class="primary" type="button" onclick="saveMarketMapResearch()">Save Research</button></div></div>'+
      renderHistoryBlock(row)+
      (gap!==null?'<div class="muted" style="margin-top:10px;font-size:12px">JGAP target is '+money(gap)+' below asking. Deal economics remain in the Deal Analyzer.</div>':'');
  }
  window.saveMarketMapResearch=function(){if(window.__jgapMarketMapSelectedId)saveResearch(window.__jgapMarketMapSelectedId);};
  async function selectRow(id,fromMarker){
    window.__jgapMarketMapSelectedId=id;
    renderRows();
    await loadMarketHistory(id);
    renderSelectedDetails();
    const row=allRows.find(r=>r.id===id);
    if(!row)return;
    if(!fromMarker){
      const idx=allRows.findIndex(r=>r.id===id);
      const marker=markers[idx];
      if(marker){map.setView(marker.getLatLng(),15,{animate:true});marker.openPopup();}
    }
  }

  window.renderMarketMapPage=async function(){
    const {data:{user}}=await sb.auth.getUser();
    if(!user){authView();return;}
    shell();
    injectStyles();
    const main=document.querySelector('.layout>main');
    if(!main)return;
    main.innerHTML=`
      <div class="pageHead">
        <div><h1>🗺️ JGAP Market Map</h1><div class="muted">Location + market intelligence for the properties you are researching.</div></div>
        <div class="toolbar"><button class="secondary" type="button" onclick="render()">← Dashboard</button><button class="primary" type="button" id="marketMapRefresh">↻ Refresh Map</button></div>
      </div>
      <div class="panel" style="margin-bottom:16px;background:#f8fbff">
        <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap">
          <div><b>JGAP Market Intelligence Map</b><div class="muted" style="margin-top:4px">This first version reads the existing Deal Pipeline. It does not change your existing deals or analyzer.</div></div>
          <div id="marketMapCount" class="pill">Loading…</div>
        </div>
        <div class="toolbar" style="margin-top:12px">
          <input id="marketMapSearch" placeholder="Search address or deal..." oninput="renderMarketMapList()" style="max-width:280px">
          <select id="marketMapStatus" onchange="renderMarketMapList()" style="width:auto;margin:0"><option value="">For Sale + Sold</option><option value="for_sale">For Sale</option><option value="sold">Sold</option></select>
          <select id="marketMapType" onchange="renderMarketMapList()" style="width:auto;margin:0"><option value="">All Property Types</option><option value="multifamily">Multifamily</option><option value="single">Single Family</option><option value="duplex">Duplex</option><option value="triplex">Triplex</option><option value="quad">4+ Units</option></select>
          <input id="marketMapMinPrice" type="number" min="0" placeholder="Min Price" oninput="renderMarketMapList()" style="max-width:115px">
          <input id="marketMapMaxPrice" type="number" min="0" placeholder="Max Price" oninput="renderMarketMapList()" style="max-width:115px">
          <input id="marketMapMinUnits" type="number" min="0" placeholder="Min Units" oninput="renderMarketMapList()" style="max-width:105px">
          <input id="marketMapMaxUnits" type="number" min="0" placeholder="Max Units" oninput="renderMarketMapList()" style="max-width:105px">
          <select id="marketMapNeighborhood" onchange="renderMarketMapList()" style="width:auto;margin:0"><option value="">All Neighborhoods</option></select>
          <button class="secondary" type="button" onclick="clearMarketMapFilters()">Clear Filters</button>
        </div>
      </div>
      <div class="panel" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
          <div><b>Official GIS & Property Research</b><div class="muted" style="font-size:12px;margin-top:3px">Use official city mapping tools to verify parcels and zoning before relying on a map location.</div></div>
          <div class="toolbar">
            <a class="secondary" style="display:inline-block;text-decoration:none" target="_blank" rel="noopener" href="https://www.bristoltn.gov/1452/GIS-Map">Bristol GIS</a>
            <a class="secondary" style="display:inline-block;text-decoration:none" target="_blank" rel="noopener" href="https://www.bristoltn.gov/RealEstate.aspx">Bristol Real Estate Locator</a>
            <a class="secondary" style="display:inline-block;text-decoration:none" target="_blank" rel="noopener" href="https://www.kingsporttn.gov/city-services/planning-zoning/zoning/">Kingsport Zoning / GIS</a>
          </div>
        </div>
      </div>
      <div class="panel" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
          <div><b>Live Market Research</b><div class="muted" style="font-size:12px;margin-top:3px">Open current multifamily searches, then bring promising properties back into the JGAP Deal Analyzer.</div></div>
          <div class="toolbar">
            <a class="secondary" style="display:inline-block;text-decoration:none" target="_blank" rel="noopener" href="https://www.redfin.com/city/2220/TN/Bristol/multi-family-homes-for-sale">Bristol Multifamily</a>
            <a class="secondary" style="display:inline-block;text-decoration:none" target="_blank" rel="noopener" href="https://www.redfin.com/city/10066/TN/Kingsport/multi-family-homes-for-sale">Kingsport Multifamily</a>
            <a class="secondary" style="display:inline-block;text-decoration:none" target="_blank" rel="noopener" href="https://www.showcase.com/tn/kingsport/apartment-buildings/for-sale/">Kingsport Apartments</a>
          </div>
        </div>
      </div>
      <div class="panel" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div><b>Neighborhood Analysis</b><div class="muted" style="font-size:12px;margin-top:3px">Phase 5: rent and sales statistics from JGAP's entered multifamily deal data. No outside estimates are added.</div></div>
          <span class="pill">All tracked multifamily deals</span>
        </div>
        <div id="marketNeighborhoodAnalysis" style="margin-top:10px"><div class="muted">Calculating neighborhood statistics…</div></div>
      </div>
      <div class="panel" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div><b>Growth Tracking</b><div class="muted" style="font-size:12px;margin-top:3px">Phase 6: track neighborhood price and rent changes over time from JGAP's recorded market snapshots.</div></div><span class="pill">Phase 6</span>
        </div><div id="marketGrowthTracking" style="margin-top:10px"><div class="muted">Loading growth history…</div></div>
      </div>
      <div class="panel" style="margin-bottom:16px">
        <div><b>Property Intelligence Workspace</b><div id="marketMapSelectedDetails" style="margin-top:10px"><div class="muted">Select a property on the map or from the list to see its JGAP details.</div></div></div>
      </div>
      <div class="marketMapWrap">
        <div class="panel" style="padding:10px"><div id="jgapMarketMap" class="marketMapCanvas"><div style="padding:20px" class="muted">Loading map…</div></div></div>
        <div class="panel marketMapSide"><div id="marketMapList"><div class="muted">Loading deals…</div></div></div>
      </div>
      <div id="marketMapStatus" class="muted" style="font-size:12px;margin-top:10px">Loading JGAP deals…</div>
    `;
    document.getElementById('marketMapRefresh').addEventListener('click',()=>window.renderMarketMapPage());
    window.clearMarketMapFilters=function(){['marketMapSearch','marketMapMinPrice','marketMapMaxPrice','marketMapMinUnits','marketMapMaxUnits'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});['marketMapStatus','marketMapType','marketMapNeighborhood'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});renderMarketMapList();};
    try{
      const Llib=await loadLeaflet();
      const {data,error}=await sb.from('deals').select('id,company_id,name,status,property_type,asking_price,target_offer_price,purchase_price,monthly_rent,property_address,units,neighborhood').order('created_at',{ascending:false});
      if(error)throw error;
      allRows=data||[];
      marketHistoryByDeal={};
      populateNeighborhoodFilter();
      renderNeighborhoodAnalysis();
      await loadMarketGrowth();
      renderMarketMapList();
      const mapHost=document.getElementById('jgapMarketMap');
      mapHost.innerHTML='';
      map=Llib.map(mapHost,{scrollWheelZoom:true});
      Llib.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
      map.setView(CITY_FALLBACKS['bristol, tn'],11);
      await placeRows(allRows);
      const status=document.getElementById('marketMapStatus');
      if(status)status.textContent='Map updated '+new Date().toLocaleString()+'. Locations are geocoded from the deal addresses; city-level fallback is labeled when exact geocoding is unavailable.';
    }catch(e){
      console.error('JGAP Market Map failed:',e);
      const status=document.getElementById('marketMapStatus');
      if(status)status.innerHTML='<span class="error">Market Map could not load: '+escapeHtml(e.message||String(e))+'</span>';
      const host=document.getElementById('jgapMarketMap');
      if(host)host.innerHTML='<div style="padding:20px"><b>Map unavailable.</b><p class="muted">Your existing Deal Pipeline is unchanged. Refresh the page and try again.</p></div>';
    }
  };

  function populateNeighborhoodFilter(){const e=document.getElementById('marketMapNeighborhood');if(!e)return;const names=[...new Set(allRows.map(neighborhoodFor).filter(Boolean))].sort();e.innerHTML='<option value="">All Neighborhoods</option>'+names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');}
  window.renderMarketMapList=renderRows;
})();

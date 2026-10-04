(function(){
  // JGAP Deal Radar safety hotfix: keep Archive/Restore actions available even if
  // the main renderer is refreshed independently.
  async function archiveRadarOpportunity(id){
    var rows=window.__jgapRadarRows||[], r=rows.find(function(x){return x.id===id;});
    if(!r || typeof sb==='undefined') return;
    var label=r.name||r.address||'this property';
    if(!confirm('Archive '+label+' from Deal Radar?\n\nIt will leave the active radar but remain available under Show archived.')) return;
    var res=await sb.from('radar_opportunities').update({archived_at:new Date().toISOString()}).eq('id',id);
    if(res.error){alert('Could not archive property: '+res.error.message);return;}
    if(typeof window.loadDealRadar==='function') await window.loadDealRadar();
  }
  async function restoreRadarOpportunity(id){
    if(typeof sb==='undefined') return;
    var res=await sb.from('radar_opportunities').update({archived_at:null}).eq('id',id);
    if(res.error){alert('Could not restore property: '+res.error.message);return;}
    if(typeof window.loadDealRadar==='function') await window.loadDealRadar();
  }
  window.archiveRadarOpportunity=archiveRadarOpportunity;
  window.restoreRadarOpportunity=restoreRadarOpportunity;
})();

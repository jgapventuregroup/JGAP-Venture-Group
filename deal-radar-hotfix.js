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

  // Navigation persistence: Deal Analyzer can rebuild the Deal Radar DOM when
  // the user clicks Back. Re-mount the Distress Radar whenever the Radar view
  // becomes visible again instead of requiring a hard refresh.
  function radarIsVisible(el){
    if(!el) return false;
    var cs=getComputedStyle(el);
    return cs.display!=='none' && cs.visibility!=='hidden' && el.getBoundingClientRect().height>0;
  }
  var remountTimer=null;
  function ensureDistressRadar(){
    var radar=document.getElementById('radarInbox');
    if(!radar || !radarIsVisible(radar)) return;
    if(document.getElementById('jgapDistressRadar')) return;
    if(typeof window.loadJGAPDistressRadar!=='function') return;
    if(remountTimer) clearTimeout(remountTimer);
    remountTimer=setTimeout(function(){
      remountTimer=null;
      if(document.getElementById('radarInbox') && !document.getElementById('jgapDistressRadar') && radarIsVisible(document.getElementById('radarInbox'))){
        window.loadJGAPDistressRadar();
      }
    },100);
  }
  if(!window.__jgapRadarNavigationObserver){
    window.__jgapRadarNavigationObserver=true;
    var observer=new MutationObserver(function(){ensureDistressRadar();});
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('popstate',ensureDistressRadar);
    window.addEventListener('hashchange',ensureDistressRadar);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)ensureDistressRadar();});
    var tries=0;
    var boot=setInterval(function(){
      ensureDistressRadar();
      if(++tries>120) clearInterval(boot);
    },500);
  }
})();

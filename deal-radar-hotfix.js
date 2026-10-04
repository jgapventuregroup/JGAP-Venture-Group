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

  // Deal Analyzer rebuilds the Radar DOM when Back is clicked. The first
  // navigation fix was too dependent on mutation timing. Keep a lightweight
  // watchdog that verifies the Distress Radar is actually mounted inside the
  // CURRENT radar container and remounts it whenever the container is rebuilt.
  function radarIsVisible(el){
    if(!el) return false;
    var cs=getComputedStyle(el);
    return cs.display!=='none' && cs.visibility!=='hidden' && el.getBoundingClientRect().height>0;
  }
  var remountTimer=null;
  function ensureDistressRadar(){
    var radar=document.getElementById('radarInbox');
    if(!radar || !radarIsVisible(radar) || typeof window.loadJGAPDistressRadar!=='function') return;
    var distress=document.getElementById('jgapDistressRadar');
    // If the old panel survived outside the newly-built radar container,
    // remove it so the new container gets a clean mount.
    if(distress && !radar.contains(distress)) distress.remove();
    if(document.getElementById('jgapDistressRadar')) return;
    if(remountTimer) clearTimeout(remountTimer);
    remountTimer=setTimeout(function(){
      remountTimer=null;
      var current=document.getElementById('radarInbox');
      if(current && radarIsVisible(current) && !document.getElementById('jgapDistressRadar') && typeof window.loadJGAPDistressRadar==='function'){
        window.loadJGAPDistressRadar();
      }
    },250);
  }
  if(!window.__jgapRadarNavigationObserver){
    window.__jgapRadarNavigationObserver=true;
    var observer=new MutationObserver(function(){ensureDistressRadar();});
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('popstate',ensureDistressRadar);
    window.addEventListener('hashchange',ensureDistressRadar);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)ensureDistressRadar();});
    // Do not stop after a fixed boot window. This app rebuilds views dynamically,
    // so the check must remain active for the life of the page.
    setInterval(ensureDistressRadar,750);
    setTimeout(ensureDistressRadar,100);
  }
})();

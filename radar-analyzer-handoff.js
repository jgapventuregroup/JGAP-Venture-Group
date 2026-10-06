(function(){
  async function analyzeRadarOpportunityPersistent(id){
    const r=(window.__jgapRadarRows||[]).find(x=>x.id===id);
    if(!r)return;
    try{
      const {data:dealId,error}=await sb.rpc('handoff_radar_opportunity_to_analyzer',{p_opportunity_id:id});
      if(error)throw error;
      if(!dealId)throw new Error('Radar handoff returned no Analyzer deal ID.');
      const {data:deal,error:dealError}=await sb.from('deals').select('*').eq('id',dealId).single();
      if(dealError)throw dealError;
      renderDealAnalyzer(deal);
    }catch(e){
      console.error('Radar Analyzer handoff failed:',e);
      alert('JGAP could not create the Analyzer deal: '+(e.message||e));
    }
  }
  window.addEventListener('DOMContentLoaded',function(){
    const original=window.analyzeRadarOpportunity;
    window.analyzeRadarOpportunity=analyzeRadarOpportunityPersistent;
  });
})();

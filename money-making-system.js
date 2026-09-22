/* JGAP Money-Making System — simple company snapshot */
(function(){
  const money=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  const esc=s=>(typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])));
  async function companyId(){const {data:{user}}=await sb.auth.getUser();if(!user)return null;const {data}=await sb.from('company_members').select('company_id').eq('user_id',user.id).limit(1).maybeSingle();return data?.company_id||null;}
  window.renderMoneyMakingSystem=async function(){
    const main=document.querySelector('main'); if(!main)return;
    main.innerHTML=`
      <div class="pageHead"><div><h1>JGAP Money-Making System</h1><p class="muted">A simple snapshot of where JGAP makes money, spends money, and what is in progress.</p></div><div class="toolbar"><button class="secondary" onclick="render()">Dashboard</button><button class="primary" onclick="typeof renderDealAnalyzer==='function'?renderDealAnalyzer():renderDealsPage()">Open Deal Analyzer</button></div></div>
      <div id="smsSummary" class="grid"><div class="card">Loading...</div></div>
      <div class="panel" style="margin-top:18px"><h2>Money Coming In</h2><div id="smsIncome" class="stats"></div></div>
      <div class="panel" style="margin-top:18px"><h2>Money Going Out</h2><div id="smsOutflow" class="stats"></div></div>
      <div class="panel" style="margin-top:18px"><h2>What JGAP Owns</h2><div id="smsAssets"></div></div>
      <div class="panel" style="margin-top:18px"><div class="pageHead" style="margin-bottom:10px"><div><h2 style="margin:0">Deals in Progress</h2><p class="muted" style="margin:4px 0 0">Details stay in the existing Deal Analyzer.</p></div></div><div id="smsDeals"></div></div>
      <div class="panel" style="margin-top:18px"><h2>Bottom Line</h2><div id="smsBottom" class="stats"></div></div>`;
    await loadSnapshot();
  };
  async function loadSnapshot(){
    const cid=await companyId(); if(!cid){document.getElementById('smsSummary').innerHTML='<div class="card">Please sign in.</div>';return;}
    const [pr,dl]=await Promise.all([
      sb.from('properties').select('id,name,address_line1,city,state,status,purchase_price,current_value,monthly_rent,monthly_mortgage_payment,annual_property_tax,annual_insurance,monthly_hoa,mortgage_balance').eq('company_id',cid).neq('status','sold'),
      sb.from('deals').select('id,name,status,asking_price,target_offer_price,property_address').eq('company_id',cid).neq('status','dead').order('created_at',{ascending:false})
    ]);
    if(pr.error||dl.error){document.getElementById('smsSummary').innerHTML='<div class="card"><b>Could not load the snapshot.</b><p class="muted">'+esc(pr.error?.message||dl.error?.message||'Please try again.')+'</p></div>';return;}
    const props=pr.data||[], deals=dl.data||[];
    const monthlyRent=props.reduce((s,p)=>s+Number(p.monthly_rent||0),0), mortgage=props.reduce((s,p)=>s+Number(p.monthly_mortgage_payment||0),0), tax=props.reduce((s,p)=>s+Number(p.annual_property_tax||0)/12,0), insurance=props.reduce((s,p)=>s+Number(p.annual_insurance||0)/12,0), hoa=props.reduce((s,p)=>s+Number(p.monthly_hoa||0),0);
    const monthlyCash=monthlyRent-mortgage-tax-insurance-hoa, value=props.reduce((s,p)=>s+Number(p.current_value||0),0), debt=props.reduce((s,p)=>s+Number(p.mortgage_balance||0),0), equity=value-debt;
    const activeDeals=deals.filter(d=>['lead','underwriting','offer','due_diligence','closing'].includes(d.status));
    document.getElementById('smsSummary').innerHTML=[['Monthly Rental Income',money(monthlyRent)],['Monthly Property Costs',money(mortgage+tax+insurance+hoa)],['Monthly Cash Flow',money(monthlyCash)],['Portfolio Equity',money(equity)]].map(x=>'<div class="card"><div class="muted">'+x[0]+'</div><div class="metric">'+x[1]+'</div></div>').join('');
    document.getElementById('smsIncome').innerHTML='<div><span>Rental Income</span><b>'+money(monthlyRent)+'/mo</b></div><div><span>Annualized Rental Income</span><b>'+money(monthlyRent*12)+'</b></div>';
    document.getElementById('smsOutflow').innerHTML='<div><span>Mortgage Payments</span><b>'+money(mortgage)+'/mo</b></div><div><span>Taxes + Insurance</span><b>'+money(tax+insurance)+'/mo</b></div><div><span>HOA</span><b>'+money(hoa)+'/mo</b></div>';
    document.getElementById('smsAssets').innerHTML=props.length?'<div style="overflow:auto"><table class="table"><thead><tr><th>Property</th><th>Value</th><th>Debt</th><th>Equity</th><th>Rent</th></tr></thead><tbody>'+props.map(p=>{const v=Number(p.current_value||0),d=Number(p.mortgage_balance||0);return '<tr><td><b>'+esc(p.name||'Property')+'</b><div class="muted">'+esc([p.address_line1,p.city,p.state].filter(Boolean).join(', '))+'</div></td><td>'+money(v)+'</td><td>'+money(d)+'</td><td>'+money(v-d)+'</td><td>'+money(p.monthly_rent)+'</td></tr>';}).join('')+'</tbody></table></div>':'<div class="card">No active properties recorded yet.</div>';
    document.getElementById('smsDeals').innerHTML=activeDeals.length?'<div style="overflow:auto"><table class="table"><thead><tr><th>Opportunity</th><th>Stage</th><th>Ask</th><th>Target Offer</th></tr></thead><tbody>'+activeDeals.map(d=>'<tr><td><b>'+esc(d.name||'Untitled Deal')+'</b><div class="muted">'+esc(d.property_address||'')+'</div></td><td>'+esc((d.status||'').replaceAll('_',' '))+'</td><td>'+money(d.asking_price)+'</td><td>'+money(d.target_offer_price)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="card">No active deals. Use the Deal Analyzer to add an opportunity.</div>';
    document.getElementById('smsBottom').innerHTML='<div><span>Properties</span><b>'+props.length+'</b></div><div><span>Active Deals</span><b>'+activeDeals.length+'</b></div><div><span>Portfolio Value</span><b>'+money(value)+'</b></div><div><span>Portfolio Debt</span><b>'+money(debt)+'</b></div><div><span>Portfolio Equity</span><b>'+money(equity)+'</b></div><div><span>Monthly Cash Flow</span><b>'+money(monthlyCash)+'</b></div>';
  }
})();
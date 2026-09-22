/* JGAP Money-Making System */
(function(){
  const money = n => '$' + Number(n || 0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  const pct = n => Number(n || 0).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1}) + '%';
  const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])));
  const num = id => Number(document.getElementById(id)?.value || 0);

  async function companyId(){
    const {data:{user}} = await sb.auth.getUser();
    if(!user) return null;
    const {data} = await sb.from('company_members').select('company_id').eq('user_id',user.id).limit(1).maybeSingle();
    return data?.company_id || null;
  }

  window.renderMoneyMakingSystem = async function(){
    const main=document.querySelector('main'); if(!main) return;
    main.innerHTML = `
      <div class="pageHead">
        <div><h1>JGAP Money-Making System</h1><p class="muted">Find opportunities → underwrite → offer → close → improve → monetize → reinvest.</p></div>
        <div class="toolbar"><button class="secondary" onclick="render()">Dashboard</button><button class="primary" onclick="jgapsmsNewDeal()">+ New Opportunity</button></div>
      </div>

      <div class="grid">
        <div class="card"><div class="muted">Pipeline Opportunities</div><div class="metric" id="smsDeals">—</div><div class="muted">All active opportunities</div></div>
        <div class="card"><div class="muted">Underwriting</div><div class="metric" id="smsUnderwriting">—</div><div class="muted">Deals with financial analysis</div></div>
        <div class="card"><div class="muted">Offers / Negotiation</div><div class="metric" id="smsOffers">—</div><div class="muted">Offers or negotiation stage</div></div>
        <div class="card"><div class="muted">Owned Assets</div><div class="metric" id="smsAssets">—</div><div class="muted">Properties currently held</div></div>
      </div>

      <div class="panel" style="margin-top:18px">
        <h2>JGAP Acquisition Funnel</h2>
        <p class="muted">Every opportunity should move through a defined money-making workflow.</p>
        <div class="stats">
          <div><span>1. Lead</span><b id="smsLead">0</b><button class="secondary" style="margin-top:8px" onclick="jgapsmsFilter('lead')">View</button></div>
          <div><span>2. Underwrite</span><b id="smsUW">0</b><button class="secondary" style="margin-top:8px" onclick="jgapsmsFilter('underwriting')">View</button></div>
          <div><span>3. Offer</span><b id="smsOffer">0</b><button class="secondary" style="margin-top:8px" onclick="jgapsmsFilter('offer')">View</button></div>
          <div><span>4. Due Diligence</span><b id="smsDD">0</b><button class="secondary" style="margin-top:8px" onclick="jgapsmsFilter('due_diligence')">View</button></div>
          <div><span>5. Closing</span><b id="smsClosing">0</b><button class="secondary" style="margin-top:8px" onclick="jgapsmsFilter('closing')">View</button></div>
          <div><span>6. Owned / Exit</span><b id="smsOwned">0</b><button class="secondary" style="margin-top:8px" onclick="jgapsmsFilter('closed')">View</button></div>
        </div>
      </div>

      <div class="panel" style="margin-top:18px">
        <div class="pageHead" style="margin-bottom:12px"><div><h2 style="margin:0">Opportunity Pipeline</h2><p class="muted" style="margin:4px 0 0">Use the pipeline to decide what deserves your time and capital.</p></div><div class="toolbar"><select id="smsStageFilter" onchange="jgapsmsLoad()"><option value="">All stages</option><option value="lead">Lead</option><option value="underwriting">Underwriting</option><option value="offer">Offer</option><option value="due_diligence">Due Diligence</option><option value="closing">Closing</option><option value="closed">Closed</option><option value="dead">Dead</option></select><input id="smsSearch" placeholder="Search opportunity..." oninput="jgapsmsRenderRows()" style="max-width:260px"></div></div>
        <div id="smsRows"><div class="card">Loading opportunities...</div></div>
      </div>

      <div class="panel" style="margin-top:18px">
        <h2>How JGAP Turns a Lead Into Money</h2>
        <div class="stats">
          <div><span>Acquire</span><b>Buy below value</b><div class="muted">Source motivated/off-market opportunities.</div></div>
          <div><span>Improve</span><b>Create value</b><div class="muted">Control rehab scope, budget, timeline and quality.</div></div>
          <div><span>Monetize</span><b>Choose the exit</b><div class="muted">Hold for rent, refinance, sell, or another documented strategy.</div></div>
          <div><span>Reinvest</span><b>Recycle capital</b><div class="muted">Track cash returned and deploy it into the next asset.</div></div>
        </div>
      </div>
    `;
    await jgapsmsLoad();
  };

  window.jgapsmsNewDeal = function(){
    if(typeof renderDealAnalyzer === 'function'){ renderDealAnalyzer(); return; }
    alert('The deal analyzer is not available.');
  };

  window.jgapsmsFilter = function(stage){
    const el=document.getElementById('smsStageFilter'); if(el) el.value=stage;
    jgapsmsRenderRows();
  };

  let smsData={deals:[],uw:[]};

  window.jgapsmsLoad = async function(){
    const cid=await companyId(); if(!cid)return;
    const [{data:deals,error:de},{data:uw,error:ue},{data:props,error:pe}]=await Promise.all([
      sb.from('deals').select('id,name,status,property_type,purchase_price,asking_price,target_offer_price,property_address,property_county,created_at').eq('company_id',cid).order('created_at',{ascending:false}),
      sb.from('deal_underwriting').select('*').eq('company_id',cid),
      sb.from('properties').select('id,name,status').eq('company_id',cid).neq('status','sold')
    ]);
    if(de||ue||pe){document.getElementById('smsRows').innerHTML='<div class="error">Could not load the money-making system.</div>';return;}
    smsData={deals:deals||[],uw:uw||[]};
    const active=smsData.deals.filter(d=>d.status!=='dead');
    document.getElementById('smsDeals').textContent=active.length;
    document.getElementById('smsUnderwriting').textContent=smsData.uw.length;
    document.getElementById('smsOffers').textContent=smsData.deals.filter(d=>['offer','due_diligence','closing'].includes(d.status)).length;
    document.getElementById('smsAssets').textContent=(props||[]).length;
    const count=s=>smsData.deals.filter(d=>d.status===s).length;
    document.getElementById('smsLead').textContent=count('lead');
    document.getElementById('smsUW').textContent=count('underwriting');
    document.getElementById('smsOffer').textContent=count('offer');
    document.getElementById('smsDD').textContent=count('due_diligence');
    document.getElementById('smsClosing').textContent=count('closing');
    document.getElementById('smsOwned').textContent=count('closed');
    jgapsmsRenderRows();
  };

  window.jgapsmsRenderRows = function(){
    const host=document.getElementById('smsRows'); if(!host)return;
    const stage=document.getElementById('smsStageFilter')?.value||'';
    const q=(document.getElementById('smsSearch')?.value||'').toLowerCase().trim();
    const rows=smsData.deals.filter(d=>(!stage||d.status===stage)&&(!q||[d.name,d.property_address,d.property_county,d.property_type,d.status].some(v=>String(v||'').toLowerCase().includes(q))));
    if(!rows.length){host.innerHTML='<div class="card"><b>No opportunities found.</b><p class="muted">Create a deal from + New Opportunity.</p></div>';return;}
    host.innerHTML='<div style="overflow:auto"><table class="table"><thead><tr><th>Opportunity</th><th>Stage</th><th>Ask</th><th>Target Offer</th><th>Strategy</th><th>Action</th></tr></thead><tbody>'+
      rows.map(d=>{
        const u=smsData.uw.find(x=>x.deal_id===d.id);
        const strategy=u?.strategy ? u.strategy.replaceAll('_',' ') : 'Not underwritten';
        return '<tr><td><b>'+esc(d.name||'Untitled Deal')+'</b><div class="muted">'+esc(d.property_address||'Address not entered')+'</div></td><td><span class="pill">'+esc((d.status||'lead').replaceAll('_',' '))+'</span></td><td>'+money(d.asking_price)+'</td><td>'+money(d.target_offer_price)+'</td><td>'+esc(strategy)+'</td><td><button class="secondary" onclick="jgapsmsOpenDeal(\''+d.id+'\')">Open</button></td></tr>';
      }).join('')+'</tbody></table></div>';
  };

  window.jgapsmsOpenDeal = async function(dealId){
    const d=smsData.deals.find(x=>x.id===dealId); if(!d)return;
    const existing=smsData.uw.find(x=>x.deal_id===dealId);
    const main=document.querySelector('main'); if(!main)return;
    main.innerHTML=`
      <div class="pageHead"><div><button class="secondary" onclick="renderMoneyMakingSystem()">← Money-Making System</button><h1 style="margin-top:12px">${esc(d.name||'Opportunity')}</h1><p class="muted">${esc(d.property_address||'Address not entered')}</p></div><div class="toolbar"><button class="primary" onclick="jgapsmsSave(${JSON.stringify(dealId)})">Save Underwriting</button><button class="secondary" onclick="jgapsmsAdvance(${JSON.stringify(dealId)})">Advance Stage</button></div></div>
      <div class="panel">
        <h2>1. Opportunity</h2>
        <div class="stats"><div><span>Asking Price</span><b>${money(d.asking_price)}</b></div><div><span>Current Stage</span><b>${esc((d.status||'lead').replaceAll('_',' '))}</b></div><div><span>Property Type</span><b>${esc((d.property_type||'—').replaceAll('_',' '))}</b></div><div><span>Target Offer</span><b>${money(d.target_offer_price)}</b></div></div>
      </div>
      <div class="panel" style="margin-top:18px">
        <h2>2. Underwrite the Opportunity</h2>
        <p class="muted">Enter assumptions. JGAP calculates the core flip and rental economics below.</p>
        <div class="formGrid">
          <label>Strategy<select id="sms_strategy"><option value="buy_hold">Buy & Hold</option><option value="flip">Fix & Flip</option><option value="house_hack">House Hack</option><option value="multifamily">Multifamily</option><option value="wholesale">Wholesale</option></select></label>
          <label>Lead Source<input id="sms_lead_source" value="${esc(existing?.lead_source||'')}"></label>
          <label>Seller Contact<input id="sms_seller_contact" value="${esc(existing?.seller_contact||'')}"></label>
          <label>ARV / Stabilized Value<input id="sms_arv" type="number" step="1" value="${existing?.arv??''}"></label>
          <label>Rehab Cost<input id="sms_rehab" type="number" step="1" value="${existing?.rehab_cost??0}"></label>
          <label>Acquisition Closing Costs<input id="sms_acqclose" type="number" step="1" value="${existing?.acquisition_closing_costs??0}"></label>
          <label>Financing Costs<input id="sms_finance" type="number" step="1" value="${existing?.financing_costs??0}"></label>
          <label>Holding Months<input id="sms_hold" type="number" step="1" value="${existing?.holding_months??0}"></label>
          <label>Monthly Holding Costs<input id="sms_hold_monthly" type="number" step="1" value="${existing?.monthly_holding_costs??0}"></label>
          <label>Selling Costs %<input id="sms_sellpct" type="number" step="0.1" value="${existing?.selling_cost_percent??0}"></label>
          <label>Projected Sale Price<input id="sms_sale" type="number" step="1" value="${existing?.projected_sale_price??''}"></label>
          <label>Monthly Rent<input id="sms_rent" type="number" step="1" value="${existing?.monthly_rent??0}"></label>
          <label>Vacancy %<input id="sms_vacancy" type="number" step="0.1" value="${existing?.vacancy_rate??0}"></label>
          <label>Monthly Operating Expenses<input id="sms_opex" type="number" step="1" value="${existing?.monthly_operating_expenses??0}"></label>
          <label>Monthly Debt Service<input id="sms_debt" type="number" step="1" value="${existing?.monthly_debt_service??0}"></label>
          <label>Cash Invested<input id="sms_cash" type="number" step="1" value="${existing?.cash_invested??''}"></label>
          <label>Target Profit<input id="sms_target_profit" type="number" step="1" value="${existing?.target_profit??''}"></label>
          <label>Target Cash-on-Cash %<input id="sms_target_coc" type="number" step="0.1" value="${existing?.target_cash_on_cash??''}"></label>
          <label>Target Cap Rate %<input id="sms_target_cap" type="number" step="0.1" value="${existing?.target_cap_rate??''}"></label>
        </div>
        <label>Notes<textarea id="sms_notes" rows="4">${esc(existing?.notes||'')}</textarea></label>
      </div>
      <div class="panel" style="margin-top:18px"><h2>3. Live Deal Economics</h2><div class="stats">
        <div><span>Total Acquisition Basis</span><b id="sms_total_basis">—</b></div>
        <div><span>Projected Flip Profit</span><b id="sms_flip_profit">—</b></div>
        <div><span>Profit Margin on Cost</span><b id="sms_profit_margin">—</b></div>
        <div><span>Monthly NOI</span><b id="sms_noi">—</b></div>
        <div><span>Annual NOI</span><b id="sms_annual_noi">—</b></div>
        <div><span>Cap Rate on Basis</span><b id="sms_cap">—</b></div>
        <div><span>Annual Cash Flow</span><b id="sms_cashflow">—</b></div>
        <div><span>Cash-on-Cash</span><b id="sms_coc">—</b></div>
      </div><div id="sms_flags" class="card" style="margin-top:14px;background:#fbfcfe"></div></div>
      <div class="panel" style="margin-top:18px"><h2>4. Next Money-Making Action</h2><div id="smsNextAction" class="card"><b>Enter the underwriting assumptions.</b></div></div>
    `;
    document.getElementById('sms_strategy').value=existing?.strategy||'buy_hold';
    ['sms_arv','sms_rehab','sms_acqclose','sms_finance','sms_hold','sms_hold_monthly','sms_sellpct','sms_sale','sms_rent','sms_vacancy','sms_opex','sms_debt','sms_cash','sms_target_profit','sms_target_coc','sms_target_cap'].forEach(id=>document.getElementById(id)?.addEventListener('input',jgapsmsCalc));
    jgapsmsCalc();
  };

  window.jgapsmsCalc = function(){
    const purchase=Number(smsData.deals.find(x=>x.id===window.__smsDealId)?.purchase_price||0);
    const asking=Number(smsData.deals.find(x=>x.id===window.__smsDealId)?.asking_price||0);
    const d=(window.__smsCurrentDeal)||null;
    const price=purchase||asking||0;
    const rehab=num('sms_rehab'), acq=num('sms_acqclose'), fin=num('sms_finance'), hold=num('sms_hold'), holdMonthly=num('sms_hold_monthly');
    const basis=price+rehab+acq+fin+(hold*holdMonthly);
    const sale=num('sms_sale')||num('sms_arv');
    const sellPct=num('sms_sellpct')/100;
    const saleCosts=sale*sellPct;
    const flipProfit=sale-basis-saleCosts;
    const margin=basis?flipProfit/basis*100:0;
    const rent=num('sms_rent'), vacancy=num('sms_vacancy')/100, opex=num('sms_opex'), debt=num('sms_debt');
    const effectiveRent=rent*(1-vacancy);
    const noi=effectiveRent-opex;
    const annualNoi=noi*12;
    const cap=basis?annualNoi/basis*100:0;
    const annualCash=(noi-debt)*12;
    const cash=num('sms_cash');
    const coc=cash?annualCash/cash*100:0;
    const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
    set('sms_total_basis',money(basis));
    set('sms_flip_profit',money(flipProfit));
    set('sms_profit_margin',pct(margin));
    set('sms_noi',money(noi));
    set('sms_annual_noi',money(annualNoi));
    set('sms_cap',pct(cap));
    set('sms_cashflow',money(annualCash));
    set('sms_coc',pct(coc));
    const flags=[];
    const targetProfit=num('sms_target_profit'); const targetCoc=num('sms_target_coc'); const targetCap=num('sms_target_cap');
    if(targetProfit && flipProfit<targetProfit) flags.push('Projected flip profit is below the target entered.');
    if(targetCoc && coc<targetCoc) flags.push('Projected cash-on-cash is below the target entered.');
    if(targetCap && cap<targetCap) flags.push('Projected cap rate is below the target entered.');
    if(!sale) flags.push('Enter ARV or projected sale price to calculate the flip outcome.');
    if(!cash && ['buy_hold','house_hack','multifamily'].includes(document.getElementById('sms_strategy')?.value)) flags.push('Enter cash invested to calculate cash-on-cash return.');
    document.getElementById('sms_flags').innerHTML=flags.length?'<b>Underwriting flags</b><ul>'+flags.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<b>No target exceptions entered.</b><p class="muted">The model is informational; verify assumptions with current comps, contractor bids, financing terms, taxes, insurance, and professional advice before committing capital.</p>';
    const action=document.getElementById('smsNextAction');
    if(action){
      let msg='Collect property facts, comps, contractor estimates and financing terms before making an offer.';
      if(flags.length) msg='Resolve the flagged assumptions before moving the opportunity forward.';
      else if(['offer','due_diligence','closing'].includes(window.__smsCurrentDeal?.status)) msg='Complete the next checklist item and keep the deal moving toward closing.';
      action.innerHTML='<b>'+esc(msg)+'</b>';
    }
  };

  window.jgapsmsSave = async function(dealId){
    window.__smsDealId=dealId;
    const cid=await companyId(); if(!cid)return;
    const payload={
      company_id:cid,deal_id:dealId,strategy:document.getElementById('sms_strategy').value,
      lead_source:document.getElementById('sms_lead_source').value||null,seller_contact:document.getElementById('sms_seller_contact').value||null,
      arv:num('sms_arv')||null,rehab_cost:num('sms_rehab'),acquisition_closing_costs:num('sms_acqclose'),financing_costs:num('sms_finance'),
      holding_months:Math.max(0,Math.round(num('sms_hold'))),monthly_holding_costs:num('sms_hold_monthly'),selling_cost_percent:num('sms_sellpct'),
      projected_sale_price:num('sms_sale')||null,monthly_rent:num('sms_rent'),vacancy_rate:num('sms_vacancy'),monthly_operating_expenses:num('sms_opex'),
      monthly_debt_service:num('sms_debt'),cash_invested:num('sms_cash')||null,target_profit:num('sms_target_profit')||null,target_cash_on_cash:num('sms_target_coc')||null,
      target_cap_rate:num('sms_target_cap')||null,notes:document.getElementById('sms_notes').value||null,updated_at:new Date().toISOString()
    };
    const {error}=await sb.from('deal_underwriting').upsert(payload,{onConflict:'deal_id'});
    if(error){alert('Could not save underwriting: '+error.message);return;}
    await sb.from('deals').update({status:'underwriting'}).eq('id',dealId).eq('company_id',cid).eq('status','lead');
    alert('Underwriting saved. The opportunity is now in the Underwriting stage.');
    await jgapsmsLoad();
  };

  window.jgapsmsAdvance = async function(dealId){
    const d=smsData.deals.find(x=>x.id===dealId); if(!d)return;
    const order=['lead','underwriting','offer','due_diligence','closing','closed'];
    const i=Math.max(0,order.indexOf(d.status)); const next=order[Math.min(order.length-1,i+1)];
    if(d.status==='closed'){alert('This opportunity is already closed.');return;}
    const cid=await companyId(); if(!cid)return;
    const {error}=await sb.from('deals').update({status:next}).eq('id',dealId).eq('company_id',cid);
    if(error){alert(error.message);return;}
    alert('Stage advanced to '+next.replaceAll('_',' ')+'.');
    renderMoneyMakingSystem();
  };

  const oldOpen=window.jgapsmsOpenDeal;
  window.jgapsmsOpenDeal=async function(dealId){
    window.__smsDealId=dealId;
    window.__smsCurrentDeal=smsData.deals.find(x=>x.id===dealId)||null;
    await oldOpen(dealId);
  };

  // Expose calculations after the page has rendered and ensure the selected deal is known.
  const oldRender=window.renderMoneyMakingSystem;
  window.renderMoneyMakingSystem=async function(){window.__smsDealId=null;window.__smsCurrentDeal=null;await oldRender();};

})();

/* JGAP Laundromat Division — locations, operations, equipment, maintenance, and cash flow */
(function(){
  const esc = s => typeof escapeHtml === 'function' ? escapeHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const num = id => { const v=document.getElementById(id)?.value; return v===''||v==null?null:Number(v); };
  const val = id => document.getElementById(id)?.value?.trim() || null;
  const money = v => typeof money2 === 'function' ? money2(Number(v||0)) : '$'+Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  let sites=[];

  async function companyId(){
    const {data:{user}}=await sb.auth.getUser();
    if(!user) return null;
    const {data,error}=await sb.from('company_members').select('company_id').eq('user_id',user.id).limit(1).maybeSingle();
    if(error) throw error;
    return data?.company_id||null;
  }

  window.renderLaundromatPage = async function(){
    const main=document.querySelector('main'); if(!main)return;
    main.innerHTML=`
      <div class="pageHead">
        <div><h1>JGAP Laundromat Division</h1><p class="muted">Track laundromat acquisitions, locations, revenue, expenses, equipment, maintenance, and operating performance in one place.</p></div>
        <button class="secondary" onclick="render()">← Dashboard</button>
      </div>
      <div id="laundromatMsg"></div>
      <div class="stats" id="laundromatKpis">
        <div><span>Locations</span><b id="lmSites">—</b></div>
        <div><span>Monthly Gross Revenue</span><b id="lmRevenue">—</b></div>
        <div><span>Monthly Operating Expenses</span><b id="lmExpenses">—</b></div>
        <div><span>Monthly NOI Before Debt</span><b id="lmNoi">—</b></div>
        <div><span>Equipment Value</span><b id="lmEquipment">—</b></div>
        <div><span>Open Maintenance</span><b id="lmMaintenance">—</b></div>
      </div>
      <div class="toolbar" style="margin:18px 0 12px">
        <button class="primary" onclick="showLaundromatSection('overview')">Overview</button>
        <button class="secondary" onclick="showLaundromatSection('locations')">Locations</button>
        <button class="secondary" onclick="showLaundromatSection('transactions')">Transactions</button>
        <button class="secondary" onclick="showLaundromatSection('equipment')">Equipment</button>
        <button class="secondary" onclick="showLaundromatSection('maintenance')">Maintenance</button>
      </div>
      <div id="laundromatContent">Loading...</div>`;
    await loadLaundromatData();
    showLaundromatSection('overview');
  };

  async function loadLaundromatData(){
    const [s,t,m,e] = await Promise.all([
      sb.from('laundromat_sites').select('*').order('name'),
      sb.from('laundromat_transactions').select('id,site_id,transaction_date,category,description,amount,transaction_type,created_at').order('transaction_date',{ascending:false}).limit(500),
      sb.from('laundromat_maintenance').select('id,site_id,title,description,status,estimated_cost,actual_cost,due_date,created_at').order('due_date'),
      sb.from('laundromat_equipment').select('id,site_id,name,equipment_type,quantity,purchase_cost,condition,service_date,notes,created_at').order('name')
    ]);
    for(const r of [s,t,m,e]) if(r.error) throw r.error;
    sites=s.data||[];
    window.__jgapLaundromat={transactions:t.data||[],maintenance:m.data||[],equipment:e.data||[]};
    const rev=sites.reduce((a,x)=>a+Number(x.monthly_gross_revenue||0),0);
    const exp=sites.reduce((a,x)=>a+Number(x.monthly_operating_expenses||0)+Number(x.monthly_owner_expenses||0)+Number(x.monthly_rent_or_lease||0),0);
    const eq=sites.reduce((a,x)=>a+Number(x.equipment_value||0),0);
    const open=(window.__jgapLaundromat.maintenance||[]).filter(x=>x.status!=='completed').length;
    document.getElementById('lmSites').textContent=sites.length;
    document.getElementById('lmRevenue').textContent=money(rev);
    document.getElementById('lmExpenses').textContent=money(exp);
    document.getElementById('lmNoi').textContent=money(rev-exp);
    document.getElementById('lmEquipment').textContent=money(eq);
    document.getElementById('lmMaintenance').textContent=open;
  }

  window.showLaundromatSection=function(section){
    const wrap=document.getElementById('laundromatContent'); if(!wrap)return;
    if(section==='locations') return renderLocations(wrap);
    if(section==='transactions') return renderTransactions(wrap);
    if(section==='equipment') return renderEquipment(wrap);
    if(section==='maintenance') return renderMaintenance(wrap);
    renderOverview(wrap);
  };

  function renderOverview(wrap){
    const tx=window.__jgapLaundromat?.transactions||[];
    const bySite={};
    tx.forEach(x=>{const k=x.site_id;bySite[k]??={income:0,expense:0};bySite[k][x.transaction_type]+=Number(x.amount||0);});
    wrap.innerHTML=`
      <div class="panel">
        <div class="sectionTitle">Laundromat Investment Pipeline</div>
        <p class="muted">Use this division for prospects you are evaluating as well as laundromats JGAP owns. Keep the acquisition numbers here, then use transactions, equipment, and maintenance to manage the operation after closing.</p>
      </div>
      <div class="panel" style="margin-top:16px">
        <div class="sectionTitle">Location Snapshot</div>
        ${sites.length?'<div style="overflow:auto"><table class="table"><thead><tr><th>Location</th><th>Status</th><th>Asking</th><th>Monthly Revenue</th><th>Monthly Expenses</th><th>NOI</th><th>Target CoC</th></tr></thead><tbody>'+sites.map(x=>{
          const rev=Number(x.monthly_gross_revenue||0), exp=Number(x.monthly_operating_expenses||0)+Number(x.monthly_owner_expenses||0)+Number(x.monthly_rent_or_lease||0);
          return `<tr><td><b>${esc(x.name)}</b><div class="muted">${esc(x.address||'')}</div></td><td><span class="pill">${esc(x.status||'prospect')}</span></td><td>${money(x.asking_price)}</td><td>${money(rev)}</td><td>${money(exp)}</td><td><b>${money(rev-exp)}</b></td><td>${x.target_cash_on_cash!=null?esc(x.target_cash_on_cash)+'%':'—'}</td></tr>`;
        }).join('')+'</tbody></table></div>':'<p class="muted">No laundromat locations yet. Add your first prospect below.</p>'}
      </div>
      <div class="panel" style="margin-top:16px">
        <div class="sectionTitle">Add Laundromat Location</div>
        ${siteForm()}
      </div>`;
  }

  function siteForm(){
    return `<div class="formGrid">
      <label>Name<input id="lm_name" placeholder="Main Street Laundry"></label>
      <label>Address<input id="lm_address" placeholder="123 Main St"></label>
      <label>Status<select id="lm_status"><option value="prospect">Prospect</option><option value="under_contract">Under Contract</option><option value="owned">Owned</option><option value="operating">Operating</option><option value="sold">Sold</option><option value="passed">Passed</option></select></label>
      <label>Asking Price<input id="lm_asking" type="number" step="0.01"></label>
      <label>Purchase Price<input id="lm_purchase" type="number" step="0.01"></label>
      <label>Current Value<input id="lm_value" type="number" step="0.01"></label>
      <label>Financing Amount<input id="lm_financing" type="number" step="0.01"></label>
      <label>Monthly Debt Service<input id="lm_debt" type="number" step="0.01"></label>
      <label>Monthly Rent / Lease<input id="lm_lease" type="number" step="0.01"></label>
      <label>Monthly Gross Revenue<input id="lm_revenue" type="number" step="0.01"></label>
      <label>Monthly Operating Expenses<input id="lm_opex" type="number" step="0.01"></label>
      <label>Monthly Owner Expenses<input id="lm_ownerexp" type="number" step="0.01"></label>
      <label>Equipment Value<input id="lm_equipment" type="number" step="0.01"></label>
      <label>Cash Invested<input id="lm_cash" type="number" step="0.01"></label>
      <label>Target Cash-on-Cash %<input id="lm_coc" type="number" step="0.01"></label>
      <label>Target Cap Rate %<input id="lm_cap" type="number" step="0.01"></label>
    </div>
    <label>Acquisition Notes<textarea id="lm_acqnotes" rows="3" placeholder="Seller, broker, equipment condition, utility costs, opportunity, concerns..."></textarea></label>
    <button class="primary" onclick="saveLaundromatSite()">Save Location</button>`;
  }

  window.saveLaundromatSite=async function(){
    try{
      const company_id=await companyId(); if(!company_id)throw new Error('Your account is not connected to a company.');
      const name=val('lm_name'); if(!name)throw new Error('Enter a laundromat name.');
      const {error}=await sb.from('laundromat_sites').insert({
        company_id,name,address:val('lm_address'),status:val('lm_status')||'prospect',
        asking_price:num('lm_asking'),purchase_price:num('lm_purchase'),current_value:num('lm_value'),
        financing_amount:num('lm_financing'),monthly_debt_service:num('lm_debt'),monthly_rent_or_lease:num('lm_lease'),
        monthly_gross_revenue:num('lm_revenue'),monthly_operating_expenses:num('lm_opex'),monthly_owner_expenses:num('lm_ownerexp'),
        equipment_value:num('lm_equipment'),cash_invested:num('lm_cash'),target_cash_on_cash:num('lm_coc'),
        target_cap_rate:num('lm_cap'),acquisition_notes:val('lm_acqnotes')
      });
      if(error)throw error;
      await loadLaundromatData(); showLaundromatSection('locations');
      document.getElementById('laundromatMsg').innerHTML='<div class="success">Laundromat location saved.</div>';
    }catch(e){document.getElementById('laundromatMsg').innerHTML='<div class="error">'+esc(e.message)+'</div>';}
  };

  function siteOptions(){return sites.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');}

  function renderTransactions(wrap){
    const tx=window.__jgapLaundromat?.transactions||[];
    wrap.innerHTML=`<div class="panel">
      <div class="sectionTitle">Add Transaction</div>
      <div class="formGrid">
        <label>Location<select id="lmt_site">${siteOptions()}</select></label>
        <label>Date<input id="lmt_date" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
        <label>Type<select id="lmt_type"><option value="income">Income</option><option value="expense">Expense</option></select></label>
        <label>Category<select id="lmt_category"><option>Washer Income</option><option>Dryer Income</option><option>Vending</option><option>Other Income</option><option>Utilities</option><option>Rent / Lease</option><option>Repairs</option><option>Supplies</option><option>Insurance</option><option>Payroll</option><option>Cleaning</option><option>Taxes / Licenses</option><option>Debt Service</option><option>Other Expense</option></select></label>
        <label>Amount<input id="lmt_amount" type="number" step="0.01"></label>
        <label>Description<input id="lmt_desc" placeholder="Monthly utilities, coin collections, repair..."></label>
      </div>
      <button class="primary" onclick="saveLaundromatTransaction()">Save Transaction</button>
    </div>
    <div class="panel" style="margin-top:16px"><div class="sectionTitle">Recent Transactions</div>
      ${tx.length?'<div style="overflow:auto"><table class="table"><thead><tr><th>Date</th><th>Location</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>'+tx.map(x=>`<tr><td>${esc(x.transaction_date)}</td><td>${esc(sites.find(s=>s.id===x.site_id)?.name||'')}</td><td><span class="pill">${esc(x.transaction_type)}</span></td><td>${esc(x.category)}</td><td>${esc(x.description||'—')}</td><td><b>${money(x.amount)}</b></td></tr>`).join('')+'</tbody></table></div>':'<p class="muted">No laundromat transactions yet.</p>'}
    </div>`;
  }

  window.saveLaundromatTransaction=async function(){
    try{
      const company_id=await companyId(); if(!company_id)throw new Error('Your account is not connected to a company.');
      if(!val('lmt_site'))throw new Error('Add a laundromat location first.');
      const amount=num('lmt_amount'); if(amount==null||amount<=0)throw new Error('Enter an amount greater than zero.');
      const {error}=await sb.from('laundromat_transactions').insert({company_id,site_id:val('lmt_site'),transaction_date:val('lmt_date')||new Date().toISOString().slice(0,10),category:val('lmt_category'),description:val('lmt_desc'),amount,transaction_type:val('lmt_type')});
      if(error)throw error; await loadLaundromatData(); showLaundromatSection('transactions');
    }catch(e){document.getElementById('laundromatMsg').innerHTML='<div class="error">'+esc(e.message)+'</div>';}
  };

  function renderEquipment(wrap){
    const rows=window.__jgapLaundromat?.equipment||[];
    wrap.innerHTML=`<div class="panel"><div class="sectionTitle">Add Equipment</div>
      <div class="formGrid">
        <label>Location<select id="lme_site">${siteOptions()}</select></label>
        <label>Name<input id="lme_name" placeholder="Washer #1"></label>
        <label>Equipment Type<select id="lme_type"><option>Washer</option><option>Dryer</option><option>Change Machine</option><option>Vending</option><option>Card System</option><option>Water Heater</option><option>HVAC</option><option>Other</option></select></label>
        <label>Quantity<input id="lme_qty" type="number" value="1" min="1"></label>
        <label>Purchase Cost<input id="lme_cost" type="number" step="0.01"></label>
        <label>Condition<select id="lme_condition"><option>New</option><option>Good</option><option>Fair</option><option>Poor</option><option>Needs Replacement</option></select></label>
        <label>Service Date<input id="lme_service" type="date"></label>
      </div>
      <label>Notes<textarea id="lme_notes" rows="2"></textarea></label>
      <button class="primary" onclick="saveLaundromatEquipment()">Save Equipment</button>
    </div>
    <div class="panel" style="margin-top:16px"><div class="sectionTitle">Equipment Register</div>
      ${rows.length?'<div style="overflow:auto"><table class="table"><thead><tr><th>Location</th><th>Equipment</th><th>Type</th><th>Qty</th><th>Cost</th><th>Condition</th><th>Service</th></tr></thead><tbody>'+rows.map(x=>`<tr><td>${esc(sites.find(s=>s.id===x.site_id)?.name||'')}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.equipment_type||'—')}</td><td>${esc(x.quantity)}</td><td>${money(x.purchase_cost)}</td><td>${esc(x.condition||'—')}</td><td>${esc(x.service_date||'—')}</td></tr>`).join('')+'</tbody></table></div>':'<p class="muted">No equipment recorded yet.</p>'}
    </div>`;
  }

  window.saveLaundromatEquipment=async function(){
    try{
      const company_id=await companyId(); if(!company_id)throw new Error('Your account is not connected to a company.');
      if(!val('lme_site')||!val('lme_name'))throw new Error('Select a location and enter equipment name.');
      const {error}=await sb.from('laundromat_equipment').insert({company_id,site_id:val('lme_site'),name:val('lme_name'),equipment_type:val('lme_type'),quantity:num('lme_qty')||1,purchase_cost:num('lme_cost'),condition:val('lme_condition'),service_date:val('lme_service'),notes:val('lme_notes')});
      if(error)throw error; await loadLaundromatData(); showLaundromatSection('equipment');
    }catch(e){document.getElementById('laundromatMsg').innerHTML='<div class="error">'+esc(e.message)+'</div>';}
  };

  function renderMaintenance(wrap){
    const rows=window.__jgapLaundromat?.maintenance||[];
    wrap.innerHTML=`<div class="panel"><div class="sectionTitle">Add Maintenance Item</div>
      <div class="formGrid">
        <label>Location<select id="lmm_site">${siteOptions()}</select></label>
        <label>Title<input id="lmm_title" placeholder="Replace dryer belt"></label>
        <label>Status<select id="lmm_status"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select></label>
        <label>Due Date<input id="lmm_due" type="date"></label>
        <label>Estimated Cost<input id="lmm_est" type="number" step="0.01"></label>
        <label>Actual Cost<input id="lmm_actual" type="number" step="0.01"></label>
      </div>
      <label>Description<textarea id="lmm_desc" rows="2"></textarea></label>
      <button class="primary" onclick="saveLaundromatMaintenance()">Save Maintenance</button>
    </div>
    <div class="panel" style="margin-top:16px"><div class="sectionTitle">Maintenance Queue</div>
      ${rows.length?'<div style="overflow:auto"><table class="table"><thead><tr><th>Location</th><th>Item</th><th>Status</th><th>Due</th><th>Estimated</th><th>Actual</th></tr></thead><tbody>'+rows.map(x=>`<tr><td>${esc(sites.find(s=>s.id===x.site_id)?.name||'')}</td><td><b>${esc(x.title)}</b><div class="muted">${esc(x.description||'')}</div></td><td><span class="pill">${esc(x.status)}</span></td><td>${esc(x.due_date||'—')}</td><td>${money(x.estimated_cost)}</td><td>${money(x.actual_cost)}</td></tr>`).join('')+'</tbody></table></div>':'<p class="muted">No maintenance items yet.</p>'}
    </div>`;
  }

  window.saveLaundromatMaintenance=async function(){
    try{
      const company_id=await companyId(); if(!company_id)throw new Error('Your account is not connected to a company.');
      if(!val('lmm_site')||!val('lmm_title'))throw new Error('Select a location and enter a maintenance title.');
      const {error}=await sb.from('laundromat_maintenance').insert({company_id,site_id:val('lmm_site'),title:val('lmm_title'),description:val('lmm_desc'),status:val('lmm_status')||'open',estimated_cost:num('lmm_est'),actual_cost:num('lmm_actual'),due_date:val('lmm_due')});
      if(error)throw error; await loadLaundromatData(); showLaundromatSection('maintenance');
    }catch(e){document.getElementById('laundromatMsg').innerHTML='<div class="error">'+esc(e.message)+'</div>';}
  };
})();
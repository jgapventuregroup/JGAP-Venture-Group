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
      <div class="panel" style="margin-top:18px"><h2>JGAP Acquisition Guardrails</h2>
        <div class="stats">
          <div><span>Volunteer Coin Laundry Reserve</span><b>$80,000</b></div>
          <div><span>Minimum New Deal Cash Flow Target</span><b>$500+/mo</b></div>
          <div><span>Primary Financing Strategy</span><b>Seller Financing</b></div>
        </div>
        <p class="muted" style="margin:12px 0 0">The $80,000 laundry reserve is protected unless a specific acquisition plan is approved. Seller-financing scenarios are comparison tools only until actual terms are verified.</p>
      </div>
      <div class="panel" style="margin-top:18px"><div class="pageHead" style="margin-bottom:10px"><div><h2 style="margin:0">Seller-Financing Playbook</h2><p class="muted" style="margin:4px 0 0">Compare structures before deciding what a deal can afford.</p></div><button class="primary" onclick="openJGAPSellerFinancingPlaybook()">Open Calculator</button></div>
        <div class="stats">
          <div><span>10% Down</span><b>Seller Note</b></div>
          <div><span>15% Down</span><b>Seller Note</b></div>
          <div><span>20% Down</span><b>Seller Note</b></div>
        </div>
      </div>
      <div class="panel" style="margin-top:18px"><h2>Bottom Line</h2><div id="smsBottom" class="stats"></div></div>`;
    await loadSnapshot();
  };
  window.openJGAPSellerFinancingPlaybook=function(){
    const main=document.querySelector('main'); if(!main)return;
    main.innerHTML=`
      <div class="pageHead"><div><h1>Seller-Financing Playbook</h1><p class="muted">Use real seller terms when available. The examples below are comparison scenarios only.</p></div><div class="toolbar"><button class="secondary" onclick="renderMoneyMakingSystem()">← Money-Making System</button><button class="primary" onclick="typeof renderDealAnalyzer==='function'?renderDealAnalyzer():renderDealsPage()">Open Deal Analyzer</button></div></div>
      <div class="panel">
        <h2>Deal Inputs</h2>
        <div class="formGrid">
          <label>Purchase Price<input id="sfPrice" type="number" value="300000"></label>
          <label>Monthly NOI<input id="sfNoi" type="number" value="3000"></label>
          <label>Closing / Other Cash<input id="sfClosing" type="number" value="10000"></label>
          <label>Monthly Other Debt / Costs<input id="sfOther" type="number" value="0"></label>
        </div>
        <div class="stats" id="sfResults"></div>
      </div>
      <div class="panel" style="margin-top:16px">
        <h2>Compare Seller Terms</h2>
        <div style="overflow:auto"><table class="table"><thead><tr><th>Scenario</th><th>Down</th><th>Seller Note</th><th>Rate</th><th>Amortization</th><th>Monthly Payment</th><th>Cash Flow After Seller</th><th>Cash Required</th></tr></thead><tbody id="sfTable"></tbody></table></div>
        <p class="muted" style="font-size:12px;margin-top:12px">Example rate: 6%. Change it when a seller gives us actual terms. Balloon payments, taxes, insurance, repairs, reserves and other expenses must be included in the full underwriting.</p>
      </div>`;
    ['sfPrice','sfNoi','sfClosing','sfOther'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderSellerFinancingTable));
    renderSellerFinancingTable();
  };
  window.renderSellerFinancingTable=function(){
    const p=Number(document.getElementById('sfPrice')?.value||0),noi=Number(document.getElementById('sfNoi')?.value||0),closing=Number(document.getElementById('sfClosing')?.value||0),other=Number(document.getElementById('sfOther')?.value||0);
    const rows=[10,15,20].map(dp=>{
      const down=p*dp/100,note=p-down,rate=.06/12,n=30*12,pmt=note>0?note*rate/(1-Math.pow(1+rate,-n)):0,cash=down+closing;
      return {dp,down,note,pmt,cash,cf:noi-pmt-other};
    });
    const money0=n=>money(n);
    const host=document.getElementById('sfTable'); if(host)host.innerHTML=rows.map(r=>'<tr><td><b>'+r.dp+'% down</b></td><td>'+money0(r.down)+'</td><td>'+money0(r.note)+'</td><td>6.00%</td><td>30 years</td><td>'+money0(r.pmt)+'/mo</td><td><b>'+money0(r.cf)+'/mo</b></td><td>'+money0(r.cash)+'</td></tr>').join('');
    const summary=document.getElementById('sfResults'); if(summary)summary.innerHTML='<div><span>Purchase Price</span><b>'+money0(p)+'</b></div><div><span>Monthly NOI</span><b>'+money0(noi)+'</b></div><div><span>Protected Laundry Reserve</span><b>$80,000</b></div>';
  };
  async function loadSnapshot(){
    const cid=await companyId(); if(!cid){document.getElementById('smsSummary').innerHTML='<div class="card">Please sign in.</div>';return;}
    const [pr,dl,tx]=await Promise.all([
      sb.from('properties').select('id,name,address_line1,city,state,status,purchase_price,current_value,monthly_rent,monthly_mortgage_payment,annual_property_tax,annual_insurance,monthly_hoa,mortgage_balance').eq('company_id',cid).neq('status','sold'),
      sb.from('deals').select('id,name,status,asking_price,target_offer_price,property_address').eq('company_id',cid).neq('status','dead').order('created_at',{ascending:false}),
      sb.from('financial_transactions').select('id,property_id,transaction_date,category,description,amount,transaction_type').eq('company_id',cid).gte('transaction_date',new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().slice(0,10)).lt('transaction_date',new Date(new Date().getFullYear(),new Date().getMonth()+1,1).toISOString().slice(0,10))
    ]);
    if(pr.error||dl.error||tx.error){document.getElementById('smsSummary').innerHTML='<div class="card"><b>Could not load the snapshot.</b><p class="muted">'+esc(pr.error?.message||dl.error?.message||tx.error?.message||'Please try again.')+'</p></div>';return;}
    const props=pr.data||[], deals=dl.data||[], transactions=tx.data||[];
    const monthlyRent=props.reduce((s,p)=>s+Number(p.monthly_rent||0),0), mortgage=props.reduce((s,p)=>s+Number(p.monthly_mortgage_payment||0),0), tax=props.reduce((s,p)=>s+Number(p.annual_property_tax||0)/12,0), insurance=props.reduce((s,p)=>s+Number(p.annual_insurance||0)/12,0), hoa=props.reduce((s,p)=>s+Number(p.monthly_hoa||0),0);
    const transactionIncome=transactions.filter(t=>t.transaction_type==='income').reduce((s,t)=>s+Number(t.amount||0),0), transactionExpenses=transactions.filter(t=>t.transaction_type==='expense').reduce((s,t)=>s+Number(t.amount||0),0);
    const monthlyCash=monthlyRent+transactionIncome-mortgage-tax-insurance-hoa-transactionExpenses, value=props.reduce((s,p)=>s+Number(p.current_value||0),0), debt=props.reduce((s,p)=>s+Number(p.mortgage_balance||0),0), equity=value-debt;
    const activeDeals=deals.filter(d=>['lead','analyzing','due_diligence','offer','under_contract'].includes(d.status));
    document.getElementById('smsSummary').innerHTML=[['Monthly Rental Income',money(monthlyRent)],['Monthly Property Costs',money(mortgage+tax+insurance+hoa+transactionExpenses)],['Monthly Cash Flow',money(monthlyCash)],['Portfolio Equity',money(equity)]].map(x=>'<div class="card"><div class="muted">'+x[0]+'</div><div class="metric">'+x[1]+'</div></div>').join('');
    document.getElementById('smsIncome').innerHTML='<div><span>Rental Income</span><b>'+money(monthlyRent)+'/mo</b></div><div><span>Other Property Income (this month)</span><b>'+money(transactionIncome)+'</b></div><div><span>Annualized Rental Income</span><b>'+money(monthlyRent*12)+'</b></div>';
    document.getElementById('smsOutflow').innerHTML='<div><span>Mortgage Payments</span><b>'+money(mortgage)+'/mo</b></div><div><span>Taxes + Insurance</span><b>'+money(tax+insurance)+'/mo</b></div><div><span>HOA</span><b>'+money(hoa)+'/mo</b></div>';
    document.getElementById('smsAssets').innerHTML=props.length?'<div style="overflow:auto"><table class="table"><thead><tr><th>Property</th><th>Value</th><th>Debt</th><th>Equity</th><th>Rent</th></tr></thead><tbody>'+props.map(p=>{const v=Number(p.current_value||0),d=Number(p.mortgage_balance||0);return '<tr><td><b>'+esc(p.name||'Property')+'</b><div class="muted">'+esc([p.address_line1,p.city,p.state].filter(Boolean).join(', '))+'</div></td><td>'+money(v)+'</td><td>'+money(d)+'</td><td>'+money(v-d)+'</td><td>'+money(p.monthly_rent)+'</td></tr>';}).join('')+'</tbody></table></div>':'<div class="card">No active properties recorded yet.</div>';
    document.getElementById('smsDeals').innerHTML=activeDeals.length?'<div style="overflow:auto"><table class="table"><thead><tr><th>Opportunity</th><th>Stage</th><th>Ask</th><th>Target Offer</th></tr></thead><tbody>'+activeDeals.map(d=>'<tr><td><b>'+esc(d.name||'Untitled Deal')+'</b><div class="muted">'+esc(d.property_address||'')+'</div></td><td>'+esc((d.status||'').replaceAll('_',' '))+'</td><td>'+money(d.asking_price)+'</td><td>'+money(d.target_offer_price)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="card">No active deals. Use the Deal Analyzer to add an opportunity.</div>';
    document.getElementById('smsBottom').innerHTML='<div><span>Properties</span><b>'+props.length+'</b></div><div><span>Active Deals</span><b>'+activeDeals.length+'</b></div><div><span>Portfolio Value</span><b>'+money(value)+'</b></div><div><span>Portfolio Debt</span><b>'+money(debt)+'</b></div><div><span>Portfolio Equity</span><b>'+money(equity)+'</b></div><div><span>Monthly Cash Flow</span><b>'+money(monthlyCash)+'</b></div>';
  }
})();

/* JGAP Deal Analyzer calculation fix — 2026-09-27
   Keeps asking price separate from the price being tested and uses one
   consistent underwriting formula for cash flow, NOI, cap rate, CoC and DSCR. */
(function(){
  function installDealAnalyzerFix(){
    if(typeof window.n!=="function" || document.getElementById("d_price")===null) return;

    window.calcDeal=function(){
      if(!document.getElementById("d_price")) return;

      const price=Number(document.getElementById("d_price")?.value||0);
      const down=Number(document.getElementById("d_down")?.value||0);
      const ratePct=Number(document.getElementById("d_rate")?.value||0);
      const rate=ratePct/100;
      const term=Math.max(1,Number(document.getElementById("d_term")?.value||30));
      const close=Number(document.getElementById("d_close")?.value||0);
      const rehab=Number(document.getElementById("d_rehab")?.value||0);
      const rent=Number(document.getElementById("d_rent")?.value||0);
      const vacancyPct=Math.min(99,Math.max(0,Number(document.getElementById("d_vacancy")?.value||0)));
      const vacancy=vacancyPct/100;
      const exp=Number(document.getElementById("d_exp")?.value||0);
      const other=Number(document.getElementById("d_other")?.value||0);
      const structure=document.getElementById("d_loan_structure")?.value||"amortizing";
      const months=term*12;

      const paymentFor=(principal)=>{
        if(principal<=0 || structure==="none") return 0;
        if(structure==="interest_only") return principal*(rate/12);
        const mr=rate/12;
        return mr ? principal*mr*Math.pow(1+mr,months)/(Math.pow(1+mr,months)-1) : principal/months;
      };

      const loan=structure==="none" ? 0 : Math.max(0,price-down);
      const debt=paymentFor(loan);
      const effectiveIncome=rent*(1-vacancy)+other;
      const noi=effectiveIncome-exp;
      const annualNoi=noi*12;
      const cashFlow=noi-debt;
      const cashInvested=Math.max(0,Math.min(down,price))+close+rehab;
      const capRate=price>0 ? annualNoi/price : 0;
      const coc=cashInvested>0 ? cashFlow*12/cashInvested : 0;
      const dscr=debt>0 ? noi/debt : 0;
      const breakEven=rent>0 ? Math.min(999,(debt+exp-other)/rent) : 0;

      const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
      set("r_loan",money2(loan));
      set("r_debt",money2(debt));
      set("r_income",money2(effectiveIncome));
      set("r_noi",money2(noi));
      set("r_anoi",money2(annualNoi));
      set("r_cf",money2(cashFlow));
      set("r_cap",(capRate*100).toFixed(2)+"%");
      set("r_coc",(coc*100).toFixed(2)+"%");
      set("r_dscr",debt>0?dscr.toFixed(2):"—");
      set("r_be",(breakEven*100).toFixed(1)+"%");
      set("r_cash",money2(cashInvested));

      const targetCoc=Number(document.getElementById("d_target_coc")?.value||0)/100;
      const targetCap=Number(document.getElementById("d_target_cap")?.value||0)/100;
      const dscrRaw=document.getElementById("d_target_dscr")?.value;
      const targetDscr=dscrRaw===""||dscrRaw==null?null:Number(dscrRaw);
      const meets=coc>=targetCoc && capRate>=targetCap && (targetDscr===null || dscr>=targetDscr);
      set("r_target",meets?"Meets all entered targets":"Below one or more entered targets");

      const status=document.getElementById("dealStatus");
      if(status){
        status.innerHTML='<b>'+ (meets?"Entered targets met":"Below one or more entered targets") +
          '</b><p class="muted">Cap rate '+(capRate*100).toFixed(2)+'% vs '+(targetCap*100).toFixed(1)+
          '% • Cash-on-cash '+(coc*100).toFixed(2)+'% vs '+(targetCoc*100).toFixed(1)+
          '%'+(targetDscr===null?" • DSCR not required for this analysis":" • DSCR "+dscr.toFixed(2)+" vs "+targetDscr.toFixed(2))+
          '. These are calculations from your inputs, not an investment recommendation.</p>';
      }

      // Maximum prices are solved using the same fixed cash/down-payment assumptions
      // entered by the user. This avoids changing the underwriting basis mid-calculation.
      const solve=(condition)=>{
        let lo=0,hi=Math.max(price*4,1000000);
        for(let i=0;i<80;i++){
          const mid=(lo+hi)/2;
          const d=paymentFor(Math.max(0,mid-down));
          if(condition(mid,d)) lo=mid; else hi=mid;
        }
        return lo;
      };
      const maxCap=targetCap>0 && annualNoi>0 ? annualNoi/targetCap : null;
      const maxCoc=targetCoc>0 ? solve((p,d)=>{
        const c=Math.max(0,Math.min(down,p))+close+rehab;
        return c>0 && ((noi-d)*12/c)>=targetCoc;
      }) : null;
      const maxDscr=targetDscr!==null && targetDscr>0 ? solve((p,d)=>d>0 ? noi/d>=targetDscr : true) : null;

      const minCf=Number(document.getElementById("d_min_cf")?.value||0);
      const maxCf=minCf>0 ? solve((p,d)=>(noi-d)>=minCf) : null;
      const targetValues=[maxCap,maxCoc,maxDscr,maxCf].filter(v=>typeof v==="number"&&v>0&&Number.isFinite(v));
      const maxPrice=targetValues.length?Math.min(...targetValues):null;
      const buffer=Math.min(100,Math.max(0,Number(document.getElementById("d_offer_buffer")?.value||0)))/100;
      const targetOffer=maxPrice===null?null:maxPrice*(1-buffer);
      const show=v=>v===null?"—":money2(v);

      set("r_max_cap",show(maxCap));
      set("r_max_coc",show(maxCoc));
      set("r_max_dscr",show(maxDscr));
      set("r_max_cf",show(maxCf));
      set("r_jgap_max_price",show(maxPrice));
      set("r_jgap_target_offer",show(targetOffer));

      const dscrBox=document.getElementById("maxDscrBox");
      if(dscrBox) dscrBox.style.display=(targetDscr!==null&&targetDscr>0)?"":"none";
      const cfBox=document.getElementById("maxCfBox");
      if(cfBox) cfBox.style.display=minCf>0?"":"none";

      const targetMsg=document.getElementById("targetPriceMessage");
      if(targetMsg){
        targetMsg.innerHTML=maxPrice===null
          ? '<b>No positive purchase price meets the entered target(s) under the current assumptions.</b><div class="muted" style="margin-top:5px">Review rent, vacancy, operating expenses, financing, and return targets. The analyzer is showing the math from your inputs rather than forcing a positive offer price.</div>'
          : '<span class="muted">Maximum price is the lowest positive price supported by the entered target constraints.</span>';
      }

      const scenarios=document.getElementById("scenarioCards");
      if(scenarios){
        const rows=[
          ["Conservative",Math.min(.99,vacancy+.05),exp*1.10],
          ["Expected",vacancy,exp],
          ["Optimistic",Math.max(0,vacancy-.02),exp*.95]
        ];
        scenarios.innerHTML=rows.map(([name,v,e])=>{
          const inc=rent*(1-v)+other, n2=inc-e, cf=n2-debt;
          const coc2=cashInvested>0?cf*12/cashInvested:0;
          const cap2=price>0?n2*12/price:0;
          const dscr2=debt>0?n2/debt:0;
          return '<div class="card"><b>'+name+'</b><div class="muted">Vacancy '+(v*100).toFixed(1)+'% • OpEx '+money2(e)+'/mo</div><strong>NOI '+money2(n2)+'/mo</strong><div>Cash flow '+money2(cf)+'/mo</div><div>Cap '+(cap2*100).toFixed(2)+'% • CoC '+(coc2*100).toFixed(2)+'% • DSCR '+(debt>0?dscr2.toFixed(2):"—")+'</div></div>';
        }).join("");
      }

      const fc=document.getElementById("financingComparison");
      if(fc){
        const downPcts=[10,15,20,25,30], rates=[ratePct-1,ratePct,ratePct+1,ratePct+2], rows=[];
        downPcts.forEach(dp=>rates.forEach(rr=>{
          const principal=Math.max(0,price*(1-dp/100));
          const r=rr/100/12;
          const d=r>0?principal*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1):principal/months;
          const cashReq=price*(dp/100)+close+rehab, cflow=noi-d, cc=cashReq>0?cflow*12/cashReq:0, sd=d>0?noi/d:0;
          rows.push({dp,rr,d,cashReq,cflow,cc,sd,principal});
        }));
        fc.innerHTML='<table><thead><tr><th>Down</th><th>Rate</th><th>Loan</th><th>Cash Needed</th><th>Monthly Debt</th><th>Monthly CF</th><th>CoC</th><th>DSCR</th></tr></thead><tbody>'+
          rows.map(x=>'<tr><td>'+x.dp+'%</td><td>'+x.rr.toFixed(2)+'%</td><td>'+money2(x.principal)+'</td><td>'+money2(x.cashReq)+'</td><td>'+money2(x.d)+'</td><td>'+money2(x.cflow)+'</td><td>'+ (x.cc*100).toFixed(2)+'%</td><td>'+ (x.d>0?x.sd.toFixed(2):"—")+'</td></tr>').join('')+
          '</tbody></table>';
      }

      const ps=document.getElementById("priceSensitivity");
      if(ps){
        const mult=[.8,.9,1,1.1,1.2];
        ps.innerHTML='<table><thead><tr><th>Purchase Price</th><th>Loan</th><th>Cash Needed</th><th>Monthly CF</th><th>Cap</th><th>CoC</th><th>DSCR</th></tr></thead><tbody>'+
          mult.map(m=>{
            const p=price*m, l=Math.max(0,p-down), d=paymentFor(l), cf=noi-d, cashReq=Math.max(0,Math.min(down,p))+close+rehab;
            return '<tr><td>'+money2(p)+'</td><td>'+money2(l)+'</td><td>'+money2(cashReq)+'</td><td>'+money2(cf)+'</td><td>'+((p?noi*12/p:0)*100).toFixed(2)+'%</td><td>'+ (cashReq>0?(cf*12/cashReq*100).toFixed(2):"0.00")+'%</td><td>'+ (d>0?(noi/d).toFixed(2):"—")+'</td></tr>';
          }).join('')+
          '</tbody></table>';
      }

      const asking=Number(document.getElementById("d_asking")?.value||0)||price;
      const enteredOffer=Number(document.getElementById("d_target_offer")?.value||0);
      const workingOffer=enteredOffer||maxPrice||0;
      const diff=asking-workingOffer;
      const os=document.getElementById("offerSummary");
      if(os) os.innerHTML='<div><span>Seller asking</span><b>'+money2(asking)+'</b></div><div><span>Calculated max offer</span><b>'+money2(maxPrice)+'</b></div><div><span>Working offer</span><b>'+money2(workingOffer)+'</b></div><div><span>Gap vs asking</span><b>'+money2(diff)+' ('+(asking?(diff/asking*100).toFixed(1):"0.0")+'%)</b></div>';

      const ot=document.getElementById("offerAnalysisTable");
      if(ot){
        const rows=[["Target Cap Rate",maxCap],["Target Cash-on-Cash",maxCoc],["Target DSCR",maxDscr]];
        ot.innerHTML='<table><thead><tr><th>Target</th><th>Maximum Price</th><th>Gap vs Asking</th><th>Gap %</th></tr></thead><tbody>'+
          rows.map(([label,v])=>{
            const g=asking-(v||0);
            return '<tr><td>'+label+'</td><td>'+money2(v)+'</td><td>'+money2(g)+'</td><td>'+ (asking?(g/asking*100).toFixed(1):"0.0")+'%</td></tr>';
          }).join('')+'</tbody></table>';
      }

      const ow=document.getElementById("offerWorksheet");
      if(ow){
        const earnest=Number(document.getElementById("d_earnest")?.value||0),dd=Math.max(0,Math.round(Number(document.getElementById("d_dd_days")?.value||0))),cd=Math.max(0,Math.round(Number(document.getElementById("d_close_days")?.value||0))),ft=document.getElementById("d_offer_financing")?.value||"Not specified",cont=document.getElementById("d_contingencies")?.value||"Not specified";
        const downPct=price>0?Math.max(0,Math.min(100,down/price)):0;
        ow.innerHTML='<div class="offerPackageHeader"><div><div class="sectionTitle" style="margin:0">Offer Package — Legal Offer Form Worksheet</div><div class="muted" style="margin-top:4px">Review the offer details below, then print or prepare the email.</div></div><div class="offerActions"><button class="secondary" onclick="printPurchaseOfferPackage()">Print / Save PDF</button><button class="secondary" onclick="emailPurchaseOfferPackage()">Email Offer Package</button></div></div><div class="offerPackageGrid"><div><span class="muted">Offer price</span><strong>'+money2(workingOffer)+'</strong></div><div><span class="muted">Earnest money</span><strong>'+money2(earnest)+'</strong></div><div><span class="muted">Due diligence</span><strong>'+dd+' days</strong></div><div><span class="muted">Closing</span><strong>'+cd+' days</strong></div><div><span class="muted">Financing</span><strong>'+escapeHtml(ft)+'</strong></div><div><span class="muted">Estimated total cash</span><strong>'+money2(workingOffer?((workingOffer*downPct)+close+rehab):0)+'</strong></div></div><p class="muted" style="margin-top:10px"><b>Contingencies:</b> '+escapeHtml(cont)+'</p>';
      }
    };

    // Populate the prominent asking/offer boxes from an existing saved deal and
    // keep them synchronized with the underlying analyzer fields.
    const syncVisible=()=>{
      const ai=document.getElementById("visibleAskingInput"), oi=document.getElementById("visibleOfferInput");
      const asking=document.getElementById("d_asking"), offer=document.getElementById("d_target_offer");
      if(ai && asking && ai.value==="") ai.value=asking.value||"";
      if(oi && offer && oi.value==="") oi.value=offer.value||"";
      const max=document.getElementById("visibleMaxOffer"), calc=document.getElementById("r_jgap_max_price");
      if(max && calc) max.textContent=calc.textContent||"—";
    };
    syncVisible();
    window.__jgapDealAnalyzerFixInstalled=true;
    try{window.calcDeal();syncVisible();}catch(e){console.warn("Deal Analyzer fix:",e);}
  }

  // The main app loads this file with defer. Once it is available, replace the
  // analyzer calculation and immediately recalculate any analyzer already open.
  const previousRender=window.renderDealAnalyzer;
  if(typeof previousRender==="function" && !window.__jgapDealAnalyzerRenderWrapped){
    window.renderDealAnalyzer=function(existing){
      const result=previousRender.apply(this,arguments);
      setTimeout(installDealAnalyzerFix,0);
      return result;
    };
    window.__jgapDealAnalyzerRenderWrapped=true;
  }
  setTimeout(installDealAnalyzerFix,0);
})();

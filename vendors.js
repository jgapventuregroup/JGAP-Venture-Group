/* JGAP Vendors & Contractors — company-wide contact directory */
(function(){
  const esc = s => typeof escapeHtml === 'function' ? escapeHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const val = id => document.getElementById(id)?.value?.trim() || null;

  async function companyId(){
    const {data:{user}} = await sb.auth.getUser();
    if(!user) return null;
    const {data,error} = await sb.from('company_members').select('company_id').eq('user_id',user.id).limit(1).maybeSingle();
    if(error) throw error;
    return data?.company_id || null;
  }

  window.renderVendorsPage = async function(){
    const main=document.querySelector('main'); if(!main)return;
    main.innerHTML=`
      <div class="pageHead">
        <div><h1>Vendors & Contractors</h1><p class="muted">Keep JGAP's contractor, vendor, and service-provider contacts in one place.</p></div>
        <button class="secondary" onclick="render()">← Dashboard</button>
      </div>

      <div class="panel" style="margin-bottom:16px">
        <div class="sectionTitle">Add Vendor / Contractor</div>
        <div class="formGrid">
          <label>Contact name<input id="v_name" placeholder="John Smith"></label>
          <label>Company name<input id="v_company" placeholder="ABC Construction LLC"></label>
          <label>Type<select id="v_type"><option value="contractor">Contractor</option><option value="vendor" selected>Vendor</option><option value="service_provider">Service Provider</option><option value="professional">Professional</option><option value="other">Other</option></select></label>
          <label>Trade / Service<input id="v_trade" placeholder="HVAC, plumbing, roofing, materials..."></label>
          <label>Phone<input id="v_phone" type="tel" placeholder="(555) 555-5555"></label>
          <label>Email<input id="v_email" type="email" placeholder="name@company.com"></label>
          <label>Website<input id="v_website" placeholder="https://..."></label>
          <label>License number<input id="v_license" placeholder="Optional"></label>
          <label>Insurance expiration<input id="v_insurance" type="date"></label>
          <label>Address<input id="v_address" placeholder="Business address"></label>
        </div>
        <label>Notes<textarea id="v_notes" rows="3" placeholder="Pricing, specialties, preferred properties, payment terms, or other notes"></textarea></label>
        <div id="vendorMsg"></div>
        <button class="primary" onclick="saveVendor()">Save Contact</button>
      </div>

      <div class="panel">
        <div class="toolbar" style="justify-content:space-between;margin-bottom:12px">
          <div><div class="sectionTitle" style="margin:0">Vendor & Contractor Directory</div><div id="vendorCount" class="muted">Loading...</div></div>
          <input id="vendorSearch" placeholder="Search name, company, trade..." oninput="loadVendors()" style="max-width:320px">
        </div>
        <div id="vendorsList">Loading contacts...</div>
      </div>`;
    await loadVendors();
  };

  window.saveVendor = async function(){
    const msg=document.getElementById('vendorMsg');
    const name=val('v_name');
    if(!name){msg.innerHTML='<div class="error">Enter a contact name.</div>';return;}
    try{
      const company_id=await companyId();
      if(!company_id) throw new Error('Your account is not connected to a company.');
      const {error}=await sb.from('vendors').insert({
        company_id,name,company_name:val('v_company'),vendor_type:val('v_type')||'vendor',
        trade:val('v_trade'),phone:val('v_phone'),email:val('v_email'),website:val('v_website'),
        license_number:val('v_license'),insurance_expiration:val('v_insurance'),
        address:val('v_address'),notes:val('v_notes')
      });
      if(error) throw error;
      msg.innerHTML='<div class="success">Contact saved.</div>';
      ['v_name','v_company','v_trade','v_phone','v_email','v_website','v_license','v_insurance','v_address','v_notes'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
      document.getElementById('v_type').value='vendor';
      await loadVendors();
    }catch(e){msg.innerHTML='<div class="error">'+esc(e.message||'Unable to save contact.')+'</div>';}
  };

  window.loadVendors = async function(){
    const wrap=document.getElementById('vendorsList'); if(!wrap)return;
    const search=(document.getElementById('vendorSearch')?.value||'').trim().toLowerCase();
    let q=sb.from('vendors').select('id,name,company_name,vendor_type,trade,phone,email,website,address,license_number,insurance_expiration,notes,created_at').order('name');
    if(search) q=q.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,trade.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    const {data,error}=await q;
    if(error){wrap.innerHTML='<div class="error">Could not load contacts.<br>'+esc(error.message)+'</div>';return;}
    const rows=data||[];
    const count=document.getElementById('vendorCount'); if(count)count.textContent=rows.length+' contact'+(rows.length===1?'':'s');
    if(!rows.length){wrap.innerHTML='<p class="muted">No vendors or contractors have been added yet.</p>';return;}
    wrap.innerHTML='<div style="overflow:auto"><table class="table"><thead><tr><th>Name</th><th>Company</th><th>Type</th><th>Trade / Service</th><th>Phone</th><th>Email</th><th>Insurance</th><th></th></tr></thead><tbody>'+
      rows.map(x=>`<tr>
        <td><b>${esc(x.name)}</b></td>
        <td>${esc(x.company_name||'—')}</td>
        <td><span class="pill">${esc((x.vendor_type||'vendor').replaceAll('_',' '))}</span></td>
        <td>${esc(x.trade||'—')}</td>
        <td>${esc(x.phone||'—')}</td>
        <td>${x.email?'<a href="mailto:'+esc(x.email)+'">'+esc(x.email)+'</a>':'—'}</td>
        <td>${esc(x.insurance_expiration||'—')}</td>
        <td style="white-space:nowrap"><button class="secondary" onclick="editVendor('${x.id}')">Edit</button> <button class="secondary" onclick="deleteVendor('${x.id}')">Delete</button></td>
      </tr>
      ${(x.notes||x.address||x.license_number||x.website)?'<tr><td></td><td colspan="7"><span class="muted">'+esc([x.address,x.license_number,x.website,x.notes].filter(Boolean).join(' • '))+'</span></td></tr>':''}`).join('')+
      '</tbody></table></div>';
  };

  window.editVendor = async function(id){
    const {data:x,error}=await sb.from('vendors').select('*').eq('id',id).maybeSingle();
    if(error||!x){alert(error?.message||'Contact not found.');return;}
    const name=prompt('Contact name:',x.name||''); if(name===null)return;
    const company=prompt('Company name:',x.company_name||''); if(company===null)return;
    const type=prompt('Type (contractor, vendor, service_provider, professional, other):',x.vendor_type||'vendor'); if(type===null)return;
    const trade=prompt('Trade / Service:',x.trade||''); if(trade===null)return;
    const phone=prompt('Phone:',x.phone||''); if(phone===null)return;
    const email=prompt('Email:',x.email||''); if(email===null)return;
    const website=prompt('Website:',x.website||''); if(website===null)return;
    const license=prompt('License number:',x.license_number||''); if(license===null)return;
    const insurance=prompt('Insurance expiration (YYYY-MM-DD):',x.insurance_expiration||''); if(insurance===null)return;
    const address=prompt('Address:',x.address||''); if(address===null)return;
    const notes=prompt('Notes:',x.notes||''); if(notes===null)return;
    const {error:up}=await sb.from('vendors').update({
      name:name.trim(),company_name:company.trim()||null,vendor_type:type.trim()||'vendor',trade:trade.trim()||null,
      phone:phone.trim()||null,email:email.trim()||null,website:website.trim()||null,license_number:license.trim()||null,
      insurance_expiration:insurance.trim()||null,address:address.trim()||null,notes:notes.trim()||null,updated_at:new Date().toISOString()
    }).eq('id',id);
    if(up){alert(up.message);return;}
    loadVendors();
  };

  window.deleteVendor = async function(id){
    if(!confirm('Delete this vendor/contractor contact?'))return;
    const {error}=await sb.from('vendors').delete().eq('id',id);
    if(error){alert(error.message);return;}
    loadVendors();
  };
})();
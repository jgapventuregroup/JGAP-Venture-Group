(function(){
const E=s=>typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'');
const lenderFields=['l_inst','l_contact','l_type','l_status','l_phone','l_email','l_web','l_addr','l_loans','l_min','l_max','l_ltv','l_dscr','l_last','l_next','l_rates','l_terms','l_notes'];
function setVal(id,v){const el=document.getElementById(id);if(el)el.value=v??'';}
function clearLenderForm(){
  lenderFields.forEach(id=>setVal(id,''));
  setVal('l_type','Bank');setVal('l_status','Prospect');
  const id=document.getElementById('l_edit_id');if(id)id.value='';
  const title=document.getElementById('l_form_title');if(title)title.textContent='Add Lender';
  const btn=document.getElementById('l_save_btn');if(btn){btn.textContent='Save Lender';btn.onclick=saveLender;}
  const cancel=document.getElementById('l_cancel_btn');if(cancel)cancel.style.display='none';
  const msg=document.getElementById('l_msg');if(msg)msg.innerHTML='';
}
window.renderLendersPage=async function(){
const main=document.querySelector('main');if(!main)return;
main.innerHTML='<div class="pageHead"><div><h1>Lenders</h1><p class="muted">Build and manage JGAP relationships with lenders before the next acquisition.</p></div><button class="secondary" onclick="render()">← Dashboard</button></div>'+
'<div class="grid" id="lenderStats"><div class="card"><div class="muted">Lenders</div><div class="metric">0</div></div><div class="card"><div class="muted">Active Relationships</div><div class="metric">0</div></div><div class="card"><div class="muted">Follow-Ups Due</div><div class="metric">0</div></div></div>'+
'<div class="panel" style="margin:16px 0"><div class="sectionTitle" id="l_form_title">Add Lender</div><input type="hidden" id="l_edit_id"><div class="formGrid"><label>Institution<input id="l_inst" placeholder="Bank, credit union, private lender..."></label><label>Contact Name<input id="l_contact"></label><label>Lender Type<select id="l_type"><option>Bank</option><option>Credit Union</option><option>Commercial Lender</option><option>Private Lender</option><option>Hard Money</option><option>Other</option></select></label><label>Status<select id="l_status"><option>Prospect</option><option>Contacted</option><option>Active Relationship</option><option>Past Relationship</option></select></label><label>Phone<input id="l_phone"></label><label>Email<input id="l_email" type="email"></label><label>Website<input id="l_web"></label><label>Address<input id="l_addr"></label><label>Loan Types<input id="l_loans" placeholder="SFR, multifamily, commercial..."></label><label>Minimum Loan<input id="l_min" type="number" step="1000"></label><label>Maximum Loan<input id="l_max" type="number" step="1000"></label><label>Typical LTV %<input id="l_ltv" type="number" step="0.1"></label><label>Typical DSCR<input id="l_dscr" type="number" step="0.01"></label><label>Last Contact<input id="l_last" type="date"></label><label>Next Follow-Up<input id="l_next" type="date"></label></div><label>Rate / Fee Notes<textarea id="l_rates" rows="2"></textarea></label><label>Term / Amortization / Recourse Notes<textarea id="l_terms" rows="2"></textarea></label><label>Notes<textarea id="l_notes" rows="2"></textarea></label><div id="l_msg"></div><button class="primary" id="l_save_btn" onclick="saveLender()">Save Lender</button> <button class="secondary" id="l_cancel_btn" onclick="clearLenderForm()" style="display:none">Cancel Edit</button></div>'+
'<div class="panel"><div class="sectionTitle">Lender Directory</div><input id="l_search" placeholder="Search lenders..." oninput="loadLenders()" style="margin-bottom:12px"><div id="lenderList">Loading...</div></div>';loadLenders();};
function lenderPayload(){
const v=id=>document.getElementById(id)?.value?.trim()||null;
return {institution_name:v('l_inst'),contact_name:v('l_contact'),lender_type:v('l_type'),phone:v('l_phone'),email:v('l_email'),website:v('l_web'),address:v('l_addr'),loan_types:v('l_loans'),minimum_loan_amount:Number(v('l_min'))||null,maximum_loan_amount:Number(v('l_max'))||null,typical_ltv:Number(v('l_ltv'))||null,typical_dscr:Number(v('l_dscr'))||null,rate_notes:v('l_rates'),term_notes:v('l_terms'),status:v('l_status')||'Prospect',last_contact_date:v('l_last'),next_follow_up_date:v('l_next'),notes:v('l_notes')};
}
window.saveLender=async function(){
const msg=document.getElementById('l_msg'),p=lenderPayload();
if(!p.institution_name){if(msg)msg.innerHTML='<div class="error">Enter the lender institution name.</div>';return;}
const cid=await getCurrentCompanyId();if(!cid){if(msg)msg.innerHTML='<div class="error">Could not determine JGAP company.</div>';return;}
p.company_id=cid;
const editId=document.getElementById('l_edit_id')?.value||'';
let error;
if(editId){({error}=await sb.from('lenders').update(p).eq('id',editId).eq('company_id',cid));}
else{({error}=await sb.from('lenders').insert(p));}
if(error){if(msg)msg.innerHTML='<div class="error">'+E(error.message)+'</div>';return;}
if(msg)msg.innerHTML='<div class="success">'+(editId?'Lender updated.':'Lender saved.')+'</div>';
clearLenderForm();if(msg)msg.innerHTML='<div class="success">'+(editId?'Lender updated.':'Lender saved.')+'</div>';
loadLenders();
};
window.editLender=async function(id){
const {data,error}=await sb.from('lenders').select('*').eq('id',id).maybeSingle();
if(error||!data){const msg=document.getElementById('l_msg');if(msg)msg.innerHTML='<div class="error">'+E(error?.message||'Lender not found.')+'</div>';return;}
setVal('l_edit_id',data.id);setVal('l_inst',data.institution_name);setVal('l_contact',data.contact_name);setVal('l_type',data.lender_type||'Bank');setVal('l_status',data.status||'Prospect');setVal('l_phone',data.phone);setVal('l_email',data.email);setVal('l_web',data.website);setVal('l_addr',data.address);setVal('l_loans',data.loan_types);setVal('l_min',data.minimum_loan_amount);setVal('l_max',data.maximum_loan_amount);setVal('l_ltv',data.typical_ltv);setVal('l_dscr',data.typical_dscr);setVal('l_last',data.last_contact_date);setVal('l_next',data.next_follow_up_date);setVal('l_rates',data.rate_notes);setVal('l_terms',data.term_notes);setVal('l_notes',data.notes);
const title=document.getElementById('l_form_title');if(title)title.textContent='Edit Lender';
const btn=document.getElementById('l_save_btn');if(btn){btn.textContent='Update Lender';btn.onclick=saveLender;}
const cancel=document.getElementById('l_cancel_btn');if(cancel)cancel.style.display='';
document.getElementById('l_form_title')?.scrollIntoView({behavior:'smooth',block:'start'});
};
window.deleteLender=async function(id){
if(!confirm('Delete this lender relationship? This cannot be undone.'))return;
const cid=await getCurrentCompanyId();if(!cid){const msg=document.getElementById('l_msg');if(msg)msg.innerHTML='<div class="error">Could not determine JGAP company.</div>';return;}
const {error}=await sb.from('lenders').delete().eq('id',id).eq('company_id',cid);
if(error){const msg=document.getElementById('l_msg');if(msg)msg.innerHTML='<div class="error">'+E(error.message)+'</div>';return;}
loadLenders();
};
window.loadLenders=async function(){
const q=document.getElementById('l_search')?.value?.trim()||'';
let query=sb.from('lenders').select('*').order('next_follow_up_date',{ascending:true,nullsFirst:false}).order('institution_name');
if(q)query=query.or('institution_name.ilike.%'+q+'%,contact_name.ilike.%'+q+'%,lender_type.ilike.%'+q+'%');
const {data,error}=await query;if(error){document.getElementById('lenderList').innerHTML='<div class="error">'+E(error.message)+'</div>';return;}
const rows=data||[],active=rows.filter(x=>x.status==='Active Relationship').length,today=new Date().toISOString().slice(0,10),due=rows.filter(x=>x.next_follow_up_date&&x.next_follow_up_date<=today).length;
const cards=document.querySelectorAll('#lenderStats .metric');if(cards[0])cards[0].textContent=rows.length;if(cards[1])cards[1].textContent=active;if(cards[2])cards[2].textContent=due;
document.getElementById('lenderList').innerHTML=rows.length?'<div style="overflow:auto"><table class="table"><thead><tr><th>Institution</th><th>Contact</th><th>Type</th><th>Loan Types</th><th>Max Loan</th><th>Status</th><th>Next Follow-Up</th><th>Actions</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+E(x.institution_name)+'</b><br><span class="muted">'+E(x.phone||'')+'</span></td><td>'+E(x.contact_name||'')+'<br>'+E(x.email||'')+'</td><td>'+E(x.lender_type||'')+'</td><td>'+E(x.loan_types||'')+'</td><td>'+(x.maximum_loan_amount?'$'+Number(x.maximum_loan_amount).toLocaleString():'—')+'</td><td>'+E(x.status||'')+'</td><td>'+E(x.next_follow_up_date||'—')+'</td><td style="white-space:nowrap"><button class="secondary" onclick="editLender(\''+E(x.id)+'\')">Edit</button> <button class="secondary" onclick="deleteLender(\''+E(x.id)+'\')">Delete</button></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No lenders added yet.</div>';
};
})();
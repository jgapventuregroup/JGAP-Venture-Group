/* BDM Construction — simple Office Manager dashboard */
(function(){
  const KEY='bdm_office_manager_v1';
  const empty=()=>({tasks:[],followups:[],projects:[],notes:[],learning:[]});
  function load(){try{return Object.assign(empty(),JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return empty();}}
  function save(d){localStorage.setItem(KEY,JSON.stringify(d));}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function today(){return new Date().toISOString().slice(0,10);}
  function card(title,body){return '<div class="panel" style="margin-bottom:16px"><h2 style="margin:0 0 12px">'+title+'</h2>'+body+'</div>';}
  function emptyMsg(t){return '<div class="muted" style="padding:8px 0">'+t+'</div>';}

  window.renderOfficeManagerPage=function(){
    const d=load(), app=document.getElementById('app');
    if(!app)return;
    const openTasks=d.tasks.filter(x=>!x.done);
    const due=openTasks.filter(x=>!x.due || x.due<=today());
    const openFollow=d.followups.filter(x=>!x.done);
    const activeProjects=d.projects.filter(x=>!x.done);
    app.innerHTML='<div class="pageHead"><div><h1>BDM Office Manager</h1><div class="muted">Simple daily workspace for BDM Construction</div></div><button class="secondary" onclick="render()">Back to JGAP</button></div>'+
      '<div class="grid" style="margin-bottom:18px">'+
      '<div class="card"><div class="muted">Tasks Due</div><div class="metric">'+due.length+'</div></div>'+
      '<div class="card"><div class="muted">Follow-Ups</div><div class="metric">'+openFollow.length+'</div></div>'+
      '<div class="card"><div class="muted">Projects</div><div class="metric">'+activeProjects.length+'</div></div>'+
      '<div class="card"><div class="muted">Things I’m Learning</div><div class="metric">'+d.learning.filter(x=>!x.done).length+'</div></div>'+
      '</div>'+
      card('TODAY','<div class="toolbar"><button class="primary" onclick="bdmAddTask()">＋ Add Task</button><button class="secondary" onclick="bdmAddFollowup()">＋ Follow Up</button><button class="secondary" onclick="bdmAddNote()">＋ Note</button></div>'+
        '<div style="margin-top:14px">'+(due.length?due.slice(0,8).map((x,i)=>'<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #e6eaf0"><input type="checkbox" style="width:auto;margin:0" onchange="bdmToggle(\'tasks\','+d.tasks.indexOf(x)+')"><div style="flex:1"><b>'+esc(x.text)+'</b>'+(x.due?'<div class="muted" style="font-size:12px">Due '+esc(x.due)+'</div>':'')+'</div><button class="secondary" onclick="bdmDelete(\'tasks\','+d.tasks.indexOf(x)+')">Delete</button></div>').join(''):emptyMsg('Nothing due. You’re caught up.'))+'</div>')+
      card('FOLLOW UP','<div>'+(openFollow.length?openFollow.slice(0,8).map(x=>'<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #e6eaf0"><input type="checkbox" style="width:auto;margin:0" onchange="bdmToggle(\'followups\','+d.followups.indexOf(x)+')"><div style="flex:1"><b>'+esc(x.person)+'</b> — '+esc(x.text)+'<div class="muted" style="font-size:12px">'+(x.date?'Follow up '+esc(x.date):'No date')+'</div></div><button class="secondary" onclick="bdmDelete(\'followups\','+d.followups.indexOf(x)+')">Delete</button></div>').join(''):emptyMsg('No follow-ups right now.'))+'</div>')+
      card('PROJECTS','<div>'+(activeProjects.length?activeProjects.map((x,i)=>'<div style="padding:10px 0;border-bottom:1px solid #e6eaf0"><b>'+esc(x.customer)+'</b>'+(x.address?' — '+esc(x.address):'')+'<div class="muted" style="font-size:12px">'+esc(x.project||'Project')+(x.next?' • Next: '+esc(x.next):'')+'</div></div>').join(''):emptyMsg('No projects added yet.'))+'</div><button class="secondary" style="margin-top:10px" onclick="bdmAddProject()">＋ Add Project</button>')+
      card('NOTES','<textarea id="bdmQuickNote" rows="5" placeholder="Type anything you need to remember...">'+esc(d.notes.length?d.notes[d.notes.length-1].text:'')+'</textarea><button class="primary" onclick="bdmSaveNote()">Save Note</button>')+
      card('THINGS I’M LEARNING','<div>'+(d.learning.filter(x=>!x.done).length?d.learning.filter(x=>!x.done).map(x=>'<div style="padding:8px 0;border-bottom:1px solid #e6eaf0">• '+esc(x.text)+'</div>').join(''):emptyMsg('Add questions or things you are learning as you go.'))+'</div><button class="secondary" style="margin-top:10px" onclick="bdmAddLearning()">＋ Add Something I’m Learning</button>')+
      '<div class="muted" style="font-size:12px;margin-top:8px">This first version is intentionally simple. Your entries are saved in this browser.</div>';
  };

  window.bdmAddTask=function(){
    const text=prompt('What do you need to do?'); if(!text)return;
    const due=prompt('Due date (YYYY-MM-DD), or leave blank:')||'';
    const d=load(); d.tasks.push({text,due,done:false}); save(d); renderOfficeManagerPage();
  };
  window.bdmAddFollowup=function(){
    const person=prompt('Who do you need to follow up with?'); if(!person)return;
    const text=prompt('What do you need?')||'';
    const date=prompt('Follow-up date (YYYY-MM-DD), or leave blank:')||'';
    const d=load(); d.followups.push({person,text,date,done:false}); save(d); renderOfficeManagerPage();
  };
  window.bdmAddProject=function(){
    const customer=prompt('Customer name?'); if(!customer)return;
    const address=prompt('Property address?')||'';
    const project=prompt('Project type?')||'';
    const next=prompt('What is the next thing that needs to happen?')||'';
    const d=load(); d.projects.push({customer,address,project,next,done:false}); save(d); renderOfficeManagerPage();
  };
  window.bdmAddNote=function(){const text=prompt('What do you want to write down?');if(!text)return;const d=load();d.notes.push({text,created:new Date().toISOString()});save(d);renderOfficeManagerPage();};
  window.bdmSaveNote=function(){const el=document.getElementById('bdmQuickNote');if(!el||!el.value.trim())return;const d=load();d.notes.push({text:el.value.trim(),created:new Date().toISOString()});save(d);renderOfficeManagerPage();};
  window.bdmAddLearning=function(){const text=prompt('What question or new thing are you learning?');if(!text)return;const d=load();d.learning.push({text,done:false});save(d);renderOfficeManagerPage();};
  window.bdmToggle=function(type,index){const d=load();if(d[type]&&d[type][index]){d[type][index].done=!d[type][index].done;save(d);renderOfficeManagerPage();}};
  window.bdmDelete=function(type,index){const d=load();if(d[type]){d[type].splice(index,1);save(d);renderOfficeManagerPage();}};
})();
(function(){
  async function openLearningBook(){
    const main=document.querySelector('.layout>main');
    try{
      const {data:{user},error:authError}=await sb.auth.getUser();
      if(authError) throw authError;
      if(!user){authView();return;}
      shell();
      const target=document.querySelector('.layout>main');
      if(!target) throw new Error('JGAP main area was not found.');
      target.innerHTML='<div class="pageHead"><div><h1>📚 JGAP Real Estate Investor\'s Learning Book</h1><div class="muted">Chapters, lessons, reference material and investor education.</div></div><div style="display:flex;gap:8px;align-items:center"><button type="button" class="primary" id="lbExport">📖 Export Full Book</button></div></div><div class="detailGrid" style="grid-template-columns:310px minmax(0,1fr)"><div class="panel"><div class="sectionTitle">Book Outline</div><div id="lbList">Loading...</div></div><div class="panel"><div id="lbContent"><div class="muted">Loading...</div></div></div></div>';
      document.getElementById('lbExport').addEventListener('click',exportBook);
      const {data:chapters,error}=await sb.from('learning_book_chapters').select('id,chapter_number,part_title,chapter_title,content_html').eq('user_id',user.id).order('chapter_number');
      if(error) throw error;
      const list=document.getElementById('lbList');
      list.innerHTML=(chapters||[]).map(c=>'<button type="button" class="secondary" data-chapter="'+c.id+'" style="display:block;width:100%;text-align:left;margin:5px 0;white-space:normal"><b>Chapter '+c.chapter_number+'</b><div>'+escapeHtml(c.chapter_title)+'</div></button>').join('')||'<div class="muted">No chapters found.</div>';
      list.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>showChapter(b.dataset.chapter)));
      if(chapters&&chapters[0]) showChapter(chapters[0].id);
      async function exportBook(){
        const btn=document.getElementById('lbExport'); if(!btn)return;
        const old=btn.textContent; btn.disabled=true; btn.textContent='⏳ Building full book...';
        try{
          const {data:{session},error}=await sb.auth.getSession();
          if(error||!session) throw new Error('Your JGAP session has expired. Please sign in again.');
          const res=await fetch('https://sfsyphmnzxaplundaljy.supabase.co/functions/v1/jgap-book-export-clean',{headers:{Authorization:'Bearer '+session.access_token}});
          if(!res.ok){let msg='Book export failed.';try{const j=await res.json();msg=j.error||msg;}catch(_){}throw new Error(msg);}
          const blob=await res.blob();
          const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='JGAP_Real_Estate_Investor_Book.docx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),10000);
          btn.textContent='✅ Book Exported'; setTimeout(()=>{btn.textContent=old;btn.disabled=false;},2500);
        }catch(err){alert('Could not export the book: '+(err&&err.message?err.message:String(err)));btn.textContent=old;btn.disabled=false;}
      }
      async function showChapter(id){
        const c=(chapters||[]).find(x=>x.id===id); if(!c)return;
        const box=document.getElementById('lbContent');
        const {data:lessons,error}=await sb.from('learning_book_lessons').select('id,lesson_number,lesson_title,content_html,completed').eq('chapter_id',id).order('lesson_number');
        if(error) throw error;
        box.innerHTML='<div class="muted">'+escapeHtml(c.part_title)+' • Chapter '+c.chapter_number+'</div><h2>'+escapeHtml(c.chapter_title)+'</h2><div class="panel" style="margin-bottom:14px"><b>Chapter Overview</b><div style="margin-top:8px">'+overview(c.content_html,c.chapter_title)+'</div></div><div class="sectionTitle">Lessons</div><div id="lbLessons">'+(lessons||[]).map(l=>'<button type="button" class="secondary" data-lesson="'+l.id+'" style="display:block;width:100%;text-align:left;margin:5px 0;white-space:normal"><b>Lesson '+l.lesson_number+'</b> — '+escapeHtml(l.lesson_title)+' '+(l.completed?'✅':'')+'</button>').join('')+'</div><div id="lbLesson" style="margin-top:14px"></div>';
        box.querySelectorAll('[data-lesson]').forEach(b=>b.addEventListener('click',()=>showLesson(b.dataset.lesson,lessons||[])));
        if(lessons&&lessons[0]) showLesson(lessons[0].id,lessons);
      }
      function overview(html,title){
        const d=document.createElement('div'); d.innerHTML=html||'';
        const t=(d.textContent||'').replace(/\s+/g,' ').trim();
        if(!t)return '<p class="muted">No overview yet.</p>';
        const s=t.match(/[^.!?]+[.!?]+/g)||[t];
        const p=s.slice(0,3).join(' ');
        return '<p style="margin:0"><b>'+escapeHtml(title)+'</b> — quick preview.</p><p style="margin:8px 0 0">'+escapeHtml(p.length>420?p.slice(0,417).replace(/\s+\S*$/,'')+'...':p)+'</p>';
      }
      async function toggleLessonComplete(id,completed){
        const {error}=await sb.from('learning_book_lessons').update({completed:completed}).eq('id',id);
        if(error){alert('Could not save lesson progress: '+error.message);return false;}
        return true;
      }
      function showLesson(id,lessons){
        const l=(lessons||[]).find(x=>x.id===id); if(!l)return;
        const h=document.getElementById('lbLesson'); if(!h)return;
        h.innerHTML='<div class="panel"><div class="muted">Lesson '+l.lesson_number+'</div><h3>'+escapeHtml(l.lesson_title)+'</h3><div style="line-height:1.7;font-size:16px">'+(l.content_html||'<p>No lesson content yet.</p>')+'</div><div style="margin-top:16px"><button type="button" class="primary" id="lbCompleteBtn">'+(l.completed?'✓ Completed — Mark Incomplete':'Mark Lesson Complete')+'</button></div></div>';
        const btn=document.getElementById('lbCompleteBtn');
        if(btn)btn.addEventListener('click',async()=>{const next=!l.completed;if(await toggleLessonComplete(l.id,next)){l.completed=next;btn.textContent=next?'✓ Completed — Mark Incomplete':'Mark Lesson Complete';const listBtn=document.querySelector('[data-lesson="'+l.id+'"]');if(listBtn){listBtn.innerHTML=listBtn.innerHTML.replace(/\\s*✅$/,'')+(next?' ✅':'');}}});
      }
    }catch(err){
      const target=document.querySelector('.layout>main')||main;
      if(target) target.innerHTML='<div class="panel"><h2>Learning Book could not open</h2><p class="error">'+escapeHtml(err&&err.message?err.message:String(err))+'</p></div>';
      console.error('JGAP Learning Book:',err);
    }
  }
  window.renderLearningBookPage=openLearningBook;
})();
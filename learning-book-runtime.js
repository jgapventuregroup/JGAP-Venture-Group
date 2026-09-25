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
      target.innerHTML='<div class="pageHead"><div><h1>📚 JGAP Real Estate Investor\'s Learning Book</h1><div class="muted">Chapters, lessons, reference material and investor education.</div></div></div><div class="detailGrid" style="grid-template-columns:310px minmax(0,1fr)"><div class="panel"><div class="sectionTitle">Book Outline</div><div id="lbList">Loading...</div></div><div class="panel"><div id="lbContent"><div class="muted">Loading...</div></div></div></div>';
      const {data:chapters,error}=await sb.from('learning_book_chapters').select('id,chapter_number,part_title,chapter_title,content_html').eq('user_id',user.id).order('chapter_number');
      if(error) throw error;
      const list=document.getElementById('lbList');
      list.innerHTML=(chapters||[]).map(c=>'<button type="button" class="secondary" data-chapter="'+c.id+'" style="display:block;width:100%;text-align:left;margin:5px 0;white-space:normal"><b>Chapter '+c.chapter_number+'</b><div>'+escapeHtml(c.chapter_title)+'</div></button>').join('')||'<div class="muted">No chapters found.</div>';
      list.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>showChapter(b.dataset.chapter)));
      if(chapters&&chapters[0]) showChapter(chapters[0].id);
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
      function showLesson(id,lessons){
        const l=(lessons||[]).find(x=>x.id===id); if(!l)return;
        const h=document.getElementById('lbLesson'); if(!h)return;
        h.innerHTML='<div class="panel"><div class="muted">Lesson '+l.lesson_number+'</div><h3>'+escapeHtml(l.lesson_title)+'</h3><div style="line-height:1.7;font-size:16px">'+(l.content_html||'<p>No lesson content yet.</p>')+'</div></div>';
      }
    }catch(err){
      const target=document.querySelector('.layout>main')||main;
      if(target) target.innerHTML='<div class="panel"><h2>Learning Book could not open</h2><p class="error">'+escapeHtml(err&&err.message?err.message:String(err))+'</p></div>';
      console.error('JGAP Learning Book:',err);
    }
  }
  window.renderLearningBookPage=openLearningBook;
})();
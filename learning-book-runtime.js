(function(){
  async function openLearningBook(){
    try{
      const {data:{user},error:authError}=await sb.auth.getUser();
      if(authError) throw authError;
      if(!user){authView();return;}
      shell();
      const main=document.querySelector('.layout>main');
      if(!main) throw new Error('JGAP main area was not found.');
      main.innerHTML='<div class="pageHead"><div><h1>📚 JGAP Real Estate Investor\'s Learning Book</h1><div class="muted">Chapters, lessons, reference material and investor education.</div></div></div><div class="panel" style="margin-bottom:16px"><b>Learning Book</b><div class="muted" style="margin-top:6px">Loading your chapters and lessons...</div></div><div class="detailGrid" style="grid-template-columns:310px minmax(0,1fr)"><div class="panel"><div class="sectionTitle">Book Outline</div><div id="lbRuntimeList">Loading...</div></div><div class="panel"><div id="lbRuntimeEditor"><div class="muted">Select a chapter.</div></div></div></div>';
      const {data:chapters,error}=await sb.from('learning_book_chapters').select('id,chapter_number,part_title,chapter_title,content_html,updated_at').eq('user_id',user.id).order('chapter_number');
      if(error) throw error;
      const list=document.getElementById('lbRuntimeList');
      list.innerHTML=(chapters||[]).map(c=>'<button type="button" class="secondary" data-lb-chapter="'+c.id+'" style="display:block;width:100%;text-align:left;margin:5px 0;white-space:normal"><b>Chapter '+c.chapter_number+'</b><div>'+escapeHtml(c.chapter_title)+'</div></button>').join('')||'<div class="muted">No chapters found yet.</div>';
      list.querySelectorAll('[data-lb-chapter]').forEach(b=>b.addEventListener('click',()=>openChapter(b.dataset.lbChapter)));
      if(chapters&&chapters[0]) openChapter(chapters[0].id);
      async function openChapter(id){
        const c=(chapters||[]).find(x=>x.id===id); if(!c)return;
        const e=document.getElementById('lbRuntimeEditor'); if(!e)return;
        const {data:lessons,error}=await sb.from('learning_book_lessons').select('id,lesson_number,lesson_title,content_html,completed').eq('chapter_id',id).order('lesson_number');
        if(error) throw error;
        e.innerHTML='<div class="muted">Chapter '+c.chapter_number+' • '+escapeHtml(c.part_title)+'</div><h2>'+escapeHtml(c.chapter_title)+'</h2><div class="panel" style="background:#f8fbff;margin-bottom:14px"><b>Chapter Overview</b><div class="muted" style="margin-top:6px">Quick preview — the lesson below contains the complete teaching material.</div><div style="margin-top:8px">'+(c.content_html||'<span class="muted">No overview yet.</span>')+'</div></div><div class="sectionTitle">Lessons</div><div id="lbRuntimeLessons">'+(lessons||[]).map(l=>'<button type="button" class="secondary" data-lb-lesson="'+l.id+'" style="display:block;width:100%;text-align:left;margin:5px 0;white-space:normal"><b>Lesson '+l.lesson_number+'</b> — '+escapeHtml(l.lesson_title)+' '+(l.completed?'✅':'')+'</button>').join('')+'</div><div id="lbRuntimeLesson" style="margin-top:14px"></div>';
        e.querySelectorAll('[data-lb-lesson]').forEach(b=>b.addEventListener('click',()=>openLesson(b.dataset.lbLesson,lessons||[])));
        if(lessons&&lessons[0]) openLesson(lessons[0].id,lessons);
      }
      function learningBookOverview(html,title){
        const box=document.createElement('div');
        box.innerHTML=html||'';
        const text=(box.textContent||'').replace(/\s+/g,' ').trim();
        if(!text) return '<p class="muted">No overview yet.</p>';
        const sentences=text.match(/[^.!?]+[.!?]+/g)||[text];
        const preview=sentences.slice(0,3).join(' ').trim();
        const clipped=preview.length>420?preview.slice(0,417).replace(/\s+\S*$/,'')+'...':preview;
        return '<p style="margin:0"><b>'+escapeHtml(title)+'</b> is introduced here as a quick chapter preview.</p><p style="margin:8px 0 0">'+escapeHtml(clipped)+'</p>';
      }
      function openLesson(id,lessons){
        const l=(lessons||[]).find(x=>x.id===id); if(!l)return;
        const h=document.getElementById('lbRuntimeLesson'); if(!h)return;
        h.innerHTML='<div class="panel"><div class="muted">Lesson '+l.lesson_number+'</div><h3>'+escapeHtml(l.lesson_title)+'</h3><div style="line-height:1.7;font-size:16px">'+(l.content_html||'<p>No lesson content yet.</p>')+'</div></div>';
      }
    }catch(err){
      const main=document.querySelector('.layout>main');
      if(main) main.innerHTML='<div class="panel"><h2>Learning Book could not open</h2><p class="error">'+escapeHtml(err&&err.message?err.message:String(err))+'</p><p class="muted">The error has been isolated from the rest of the app. We can fix the book without affecting your other tabs.</p></div>';
      console.error('JGAP Learning Book:',err);
    }
  }
  window.renderLearningBookPage=openLearningBook;
})();
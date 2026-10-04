(function(){
  function loadPropertyPassport(){
    if(window.__jgapPropertyPassportLoader)return;
    window.__jgapPropertyPassportLoader=true;
    var s=document.createElement('script');s.src='./property-passport.js?v=20261004-1';s.async=false;document.head.appendChild(s);
  }
  loadPropertyPassport();
  function init(){
    if(document.getElementById('jgapRadarFilters')) return true;
    var tables=document.querySelectorAll('table'),table=null;
    for(var i=0;i<tables.length;i++){var txt=(tables[i].innerText||'').toLowerCase();if(txt.indexOf('opportunity')>=0&&txt.indexOf('status')>=0){table=tables[i];break;}}
    if(!table)return false;var rows=table.querySelectorAll('tbody tr');if(!rows.length)return false;var headers=table.querySelectorAll('th'),loc=-1,pri=-1;
    for(var i=0;i<headers.length;i++){var h=(headers[i].innerText||'').trim().toLowerCase();if(h==='location')loc=i;if(h==='priority')pri=i;}
    var bar=document.createElement('div');bar.id='jgapRadarFilters';bar.style.cssText='display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:0 0 16px;padding:12px 14px;background:#fff;border:1px solid #e2e7ef;border-radius:12px;';
    bar.innerHTML='<label style="font-weight:700;font-size:13px">Target <select id="jgapTargetFilter"><option value="all">All</option><option value="target">Target</option><option value="outside">Outside Target</option></select></label><label style="font-weight:700;font-size:13px">Priority <select id="jgapPriorityFilter"><option value="all">All</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>';
    table.parentNode.insertBefore(bar,table);
    function apply(){var tf=document.getElementById('jgapTargetFilter').value,pf=document.getElementById('jgapPriorityFilter').value;table.querySelectorAll('tbody tr').forEach(function(row){var c=row.children,location=loc>=0&&c[loc]?(c[loc].innerText||'').toLowerCase():'',fit=(location.indexOf('bristol')>=0||location.indexOf('kingsport')>=0||location.indexOf('johnson city')>=0)?'target':'outside',priority=pri>=0&&c[pri]?(c[pri].innerText||'').toLowerCase():'';row.style.display=(tf!=='all'&&fit!==tf)||(pf!=='all'&&priority.indexOf(pf)<0)?'none':'';});}
    document.getElementById('jgapTargetFilter').onchange=apply;document.getElementById('jgapPriorityFilter').onchange=apply;return true;
  }
  var n=0,t=setInterval(function(){if(init()||++n>30)clearInterval(t);},500);
})();
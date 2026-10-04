(function(){
  function loadPropertyPassport(){
    if(window.__jgapPropertyPassportLoader)return;
    window.__jgapPropertyPassportLoader=true;
    var s=document.createElement('script');s.src='./property-passport.js?v=20261004-1';s.async=false;document.head.appendChild(s);
  }
  loadPropertyPassport();

  function cleanRadarText(value){
    var text=String(value||'').trim();
    if(!text)return text;
    text=text.replace(/_/g,' ');
    if(/^https?:\/\//i.test(text)||/www\.google\.com\/maps/i.test(text)){
      var tail=text.lastIndexOf('>');
      if(tail>=0&&text.slice(tail+1).trim()) text=text.slice(tail+1).trim();
      else{
        try{
          var u=new URL(text), path=decodeURIComponent(u.pathname||'');
          var m=path.match(/\/maps\/search\/(.+)$/i);
          text=(m?m[1]:path).split('?')[0].replace(/\+/g,' ').trim();
        }catch(e){
          text=text.replace(/^https?:\/\/[^\s]+/i,'').trim();
        }
      }
      text=text.replace(/^\s*[>:-]\s*/,'').trim();
    }
    return text;
  }

  function fixRadarTitles(table){
    table.querySelectorAll('tbody tr').forEach(function(row){
      var first=row.querySelector('td');
      if(!first)return;
      var title=first.querySelector('strong,h3,h4,b');
      if(!title)return;
      var before=title.textContent||'';
      var after=cleanRadarText(before);
      if(after&&after!==before)title.textContent=after;
    });
    table.querySelectorAll('.badge,.pill,[class*="badge"],[class*="pill"]').forEach(function(el){
      if(el.children.length===0){
        var t=(el.textContent||'').trim();
        if(t.indexOf('_')>=0)el.textContent=t.replace(/_/g,' ');
      }
    });
  }

  function addRadarLayoutFix(){
    if(document.getElementById('jgapRadarInboxLayoutFix'))return;
    var style=document.createElement('style');
    style.id='jgapRadarInboxLayoutFix';
    style.textContent=''
      +'#radarInbox{width:100%;min-width:0;max-width:100%;overflow-x:hidden;box-sizing:border-box}'
      +'#radarInbox>div{width:100%;min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;box-sizing:border-box}'
      +'#radarInbox .table{min-width:1500px;width:1500px;table-layout:fixed}'
      +'#radarInbox th,#radarInbox td{white-space:normal;word-break:normal;overflow-wrap:break-word;hyphens:none;vertical-align:top;box-sizing:border-box}'
      +'#radarInbox th:nth-child(1),#radarInbox td:nth-child(1){width:300px;min-width:300px}'
      +'#radarInbox th:nth-child(2),#radarInbox td:nth-child(2){width:145px;min-width:145px}'
      +'#radarInbox th:nth-child(3),#radarInbox td:nth-child(3){width:65px;min-width:65px;text-align:center}'
      +'#radarInbox th:nth-child(4),#radarInbox td:nth-child(4){width:105px;min-width:105px}'
      +'#radarInbox th:nth-child(5),#radarInbox td:nth-child(5){width:100px;min-width:100px}'
      +'#radarInbox th:nth-child(6),#radarInbox td:nth-child(6){width:170px;min-width:170px}'
      +'#radarInbox th:nth-child(7),#radarInbox td:nth-child(7){width:85px;min-width:85px}'
      +'#radarInbox th:nth-child(8),#radarInbox td:nth-child(8){width:170px;min-width:170px}'
      +'#radarInbox th:nth-child(9),#radarInbox td:nth-child(9){width:105px;min-width:105px}'
      +'#radarInbox th:nth-child(10),#radarInbox td:nth-child(10){width:160px;min-width:160px}'
      +'#radarInbox th:nth-child(11),#radarInbox td:nth-child(11){width:70px;min-width:70px;text-align:center}'
      +'#radarInbox th:nth-child(12),#radarInbox td:nth-child(12){width:165px;min-width:165px}'
      +'#radarInbox td:nth-child(3),#radarInbox td:nth-child(4),#radarInbox td:nth-child(5),#radarInbox td:nth-child(7),#radarInbox td:nth-child(9),#radarInbox td:nth-child(11){word-break:keep-all}'
      +'#radarInbox th{word-break:normal;overflow-wrap:normal}'
      +'@media(max-width:1100px){#radarInbox .table{min-width:1400px;width:1400px}#radarInbox th,#radarInbox td{padding:8px 7px;font-size:12px}}';
    document.head.appendChild(style);
  }

  function init(){
    addRadarLayoutFix();
    if(document.getElementById('jgapRadarFilters')) return true;
    var tables=document.querySelectorAll('table'),table=null;
    for(var i=0;i<tables.length;i++){var txt=(tables[i].innerText||'').toLowerCase();if(txt.indexOf('opportunity')>=0&&txt.indexOf('status')>=0){table=tables[i];break;}}
    if(!table)return false;var rows=table.querySelectorAll('tbody tr');if(!rows.length)return false;var headers=table.querySelectorAll('th'),loc=-1,pri=-1;
    for(var i=0;i<headers.length;i++){var h=(headers[i].innerText||'').trim().toLowerCase();if(h==='location')loc=i;if(h==='priority')pri=i;}
    var bar=document.createElement('div');bar.id='jgapRadarFilters';bar.style.cssText='display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:0 0 16px;padding:12px 14px;background:#fff;border:1px solid #e2e7ef;border-radius:12px;';
    bar.innerHTML='<label style="font-weight:700;font-size:13px">Target <select id="jgapTargetFilter"><option value="all">All</option><option value="target">Target</option><option value="outside">Outside Target</option></select></label><label style="font-weight:700;font-size:13px">Priority <select id="jgapPriorityFilter"><option value="all">All</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>';
    table.parentNode.insertBefore(bar,table);
    fixRadarTitles(table);
    function apply(){var tf=document.getElementById('jgapTargetFilter').value,pf=document.getElementById('jgapPriorityFilter').value;table.querySelectorAll('tbody tr').forEach(function(row){var c=row.children,location=loc>=0&&c[loc]?(c[loc].innerText||'').toLowerCase():'',fit=(location.indexOf('bristol')>=0||location.indexOf('kingsport')>=0||location.indexOf('johnson city')>=0)?'target':'outside',priority=pri>=0&&c[pri]?(c[pri].innerText||'').toLowerCase():'';row.style.display=(tf!=='all'&&fit!==tf)||(pf!=='all'&&priority.indexOf(pf)<0)?'none':'';});}
    document.getElementById('jgapTargetFilter').onchange=apply;document.getElementById('jgapPriorityFilter').onchange=apply;return true;
  }
  var n=0,t=setInterval(function(){if(init()||++n>30)clearInterval(t);},500);
})();
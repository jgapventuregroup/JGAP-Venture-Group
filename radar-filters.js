(function(){
  function loadPropertyPassport(){
    if(window.__jgapPropertyPassportLoader)return;
    window.__jgapPropertyPassportLoader=true;
    var s=document.createElement('script');s.src='./property-passport.js?v=20261004-1';s.async=false;document.head.appendChild(s);
  }
  loadPropertyPassport();

  function cleanTitle(value){
    var text=String(value||'').trim().replace(/_/g,' ');
    if(!text)return text;
    if(/^https?:\/\//i.test(text)||/www\.google\.com\/maps/i.test(text)){
      var tail=text.lastIndexOf('>');
      if(tail>=0&&text.slice(tail+1).trim()) text=text.slice(tail+1).trim();
      else{
        try{
          var u=new URL(text),path=decodeURIComponent(u.pathname||'');
          var m=path.match(/\/maps\/search\/(.+)$/i);
          text=(m?m[1]:path).split('?')[0].replace(/\+/g,' ').trim();
        }catch(e){text=text.replace(/^https?:\/\/[^\s]+/i,'').trim();}
      }
    }
    return text.replace(/^\s*[>:-]\s*/,'').trim();
  }

  function addSafeRadarLayout(){
    if(document.getElementById('jgapRadarStableLayout'))return;
    var style=document.createElement('style');
    style.id='jgapRadarStableLayout';
    style.textContent=''
      +'#radarInbox{width:100%;min-width:0;max-width:100%;overflow:hidden;box-sizing:border-box}'
      +'#radarInbox>div{width:100%;min-width:0;max-width:100%;overflow:hidden;box-sizing:border-box}'
      +'#radarInbox .table{width:100%;min-width:0;max-width:100%;table-layout:fixed;box-sizing:border-box}'
      +'#radarInbox th,#radarInbox td{box-sizing:border-box;white-space:normal;word-break:normal;overflow-wrap:break-word;hyphens:none;vertical-align:top}'
      +'#radarInbox th:nth-child(8),#radarInbox td:nth-child(8),#radarInbox th:nth-child(10),#radarInbox td:nth-child(10),#radarInbox th:nth-child(11),#radarInbox td:nth-child(11){display:none}'
      +'#radarInbox th:nth-child(1),#radarInbox td:nth-child(1){width:26%}'
      +'#radarInbox th:nth-child(2),#radarInbox td:nth-child(2){width:11%}'
      +'#radarInbox th:nth-child(3),#radarInbox td:nth-child(3){width:5%;text-align:center;word-break:keep-all}'
      +'#radarInbox th:nth-child(4),#radarInbox td:nth-child(4){width:9%;word-break:keep-all}'
      +'#radarInbox th:nth-child(5),#radarInbox td:nth-child(5){width:10%;word-break:keep-all}'
      +'#radarInbox th:nth-child(6),#radarInbox td:nth-child(6){width:9%}'
      +'#radarInbox th:nth-child(7),#radarInbox td:nth-child(7){width:7%;word-break:keep-all}'
      +'#radarInbox th:nth-child(9),#radarInbox td:nth-child(9){width:9%}'
      +'#radarInbox th:nth-child(12),#radarInbox td:nth-child(12){width:14%;white-space:nowrap}'
      +'#radarInbox th{word-break:normal;overflow-wrap:normal}'
      +'#radarInbox td:nth-child(12)>div{min-width:0!important;display:flex!important;gap:5px!important;flex-wrap:nowrap!important;align-items:center!important}'
      +'#radarInbox td:nth-child(12) button,#radarInbox td:nth-child(12) a{padding:7px 8px!important;font-size:12px!important;line-height:1.1!important;white-space:nowrap!important;margin:0!important}'
      +'#radarInbox td:first-child b{display:block;overflow-wrap:anywhere;word-break:normal}'
      +'@media(max-width:1050px){#radarInbox th,#radarInbox td{padding:8px 6px;font-size:12px}#radarInbox td:nth-child(12) button,#radarInbox td:nth-child(12) a{padding:6px 5px!important;font-size:11px!important}}';
    document.head.appendChild(style);
  }

  function cleanTitles(table){
    table.querySelectorAll('tbody tr').forEach(function(row){
      var first=row.querySelector('td');
      if(!first)return;
      var title=first.querySelector('b,strong,h3,h4');
      if(!title)return;
      var cleaned=cleanTitle(title.textContent);
      if(cleaned&&cleaned!==title.textContent)title.textContent=cleaned;
    });
  }

  function addFilters(table){
    if(document.getElementById('jgapRadarFilters'))return;
    var headers=table.querySelectorAll('th'),loc=-1,pri=-1;
    for(var i=0;i<headers.length;i++){
      var h=(headers[i].innerText||'').trim().toLowerCase();
      if(h==='location')loc=i;if(h==='priority')pri=i;
    }
    var bar=document.createElement('div');
    bar.id='jgapRadarFilters';
    bar.style.cssText='display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:0 0 16px;padding:12px 14px;background:#fff;border:1px solid #e2e7ef;border-radius:12px;';
    bar.innerHTML='<label style="font-weight:700;font-size:13px">Target <select id="jgapTargetFilter"><option value="all">All</option><option value="target">Target</option><option value="outside">Outside Target</option></select></label><label style="font-weight:700;font-size:13px">Priority <select id="jgapPriorityFilter"><option value="all">All</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>';
    table.parentNode.insertBefore(bar,table);
    function apply(){
      var tf=document.getElementById('jgapTargetFilter').value,pf=document.getElementById('jgapPriorityFilter').value;
      table.querySelectorAll('tbody tr').forEach(function(row){
        var c=row.children,location=loc>=0&&c[loc]?(c[loc].innerText||'').toLowerCase():'',fit=(location.indexOf('bristol')>=0||location.indexOf('kingsport')>=0||location.indexOf('johnson city')>=0||location.indexOf('elizabeth')>=0)?'target':'outside',priority=pri>=0&&c[pri]?(c[pri].innerText||'').toLowerCase():'';
        row.style.display=(tf!=='all'&&fit!==tf)||(pf!=='all'&&priority.indexOf(pf)<0)?'none':'';
      });
    }
    document.getElementById('jgapTargetFilter').onchange=apply;
    document.getElementById('jgapPriorityFilter').onchange=apply;
  }

  function init(){
    addSafeRadarLayout();
    var tables=document.querySelectorAll('#radarInbox table,.table'),table=null;
    for(var i=0;i<tables.length;i++){
      var txt=(tables[i].innerText||'').toLowerCase();
      if(txt.indexOf('opportunity')>=0&&txt.indexOf('actions')>=0){table=tables[i];break;}
    }
    if(!table)return false;
    addFilters(table);
    cleanTitles(table);
    return true;
  }
  var n=0,t=setInterval(function(){if(init()||++n>30)clearInterval(t);},400);
})();
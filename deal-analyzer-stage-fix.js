(function(){
  "use strict";
  var ready=false, queue=[];
  function installDealStageFix(){
    if(typeof window.setDealStage!=="function" || window.setDealStage.__jgapStageFix)return;
    var original=window.setDealStage;
    function fixed(stage){
      var result=original.apply(this,arguments);
      var checklist=document.getElementById("dealChecklist") || document.getElementById("dealDueDiligence");
      if(checklist)checklist.style.display=(stage==="due_diligence"||stage==="under_contract")?"block":"none";
      var panel=checklist&&checklist.closest(".panel");
      if(panel)panel.style.display=(stage==="due_diligence"||stage==="under_contract")?"block":"none";
      return result;
    }
    fixed.__jgapStageFix=true;
    window.setDealStage=fixed;
  }
  installDealStageFix();
  var existingCoreRender=window.renderAlertsPage;
  if(existingCoreRender)window.__jgapAlertsCoreRender=existingCoreRender;
  if(!window.__jgapAlertsProxyInstalled){
    function proxy(){
      var args=arguments,ctx=this;
      if(ready&&typeof window.__jgapAlertsCoreRender==="function")return window.__jgapAlertsCoreRender.apply(ctx,args);
      queue.push(function(){if(typeof window.__jgapAlertsCoreRender==="function")window.__jgapAlertsCoreRender.apply(ctx,args);});
    }
    proxy.__jgapAlertsProxy=true;
    window.renderAlertsPage=proxy;
    window.__jgapAlertsProxyInstalled=true;
  }
  var core=document.querySelector('script[data-jgap-alerts-core]');
  if(!core){
    core=document.createElement("script");
    core.src="./alerts-core.js?v=20261001-1";
    core.async=false;
    core.setAttribute("data-jgap-alerts-core","1");
    core.onload=function(){
      ready=true;
      window.__jgapAlertsCoreRender=window.renderAlertsPage;
      installDealStageFix();
      queue.splice(0).forEach(function(fn){try{fn();}catch(e){}});
    };
    core.onerror=function(){ready=true;queue=[];};
    document.head.appendChild(core);
  }else{
    ready=true;
    installDealStageFix();
  }
})();
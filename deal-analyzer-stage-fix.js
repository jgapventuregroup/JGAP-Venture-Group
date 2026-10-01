(function(){
  "use strict";
  function installDealStageFix(){
    if(typeof window.setDealStage!=="function" || window.setDealStage.__jgapStageFix)return;
    var original=window.setDealStage;
    function fixed(stage){
      var result=original.apply(this,arguments);
      var checklist=document.getElementById("dealChecklist");
      var panel=checklist&&checklist.closest(".panel");
      var show=stage==="due_diligence"||stage==="under_contract";
      if(checklist)checklist.style.display=show?"block":"none";
      if(panel)panel.style.display=show?"block":"none";
      return result;
    }
    fixed.__jgapStageFix=true;
    window.setDealStage=fixed;
  }
  installDealStageFix();
  document.addEventListener("DOMContentLoaded",installDealStageFix);
})();
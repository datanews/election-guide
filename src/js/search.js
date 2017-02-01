/* global $:false */

(function(){

  var dummy = document.getElementById("dummy");

  $(".address").focus();

  $("form").on("submit", function(e){
    if (!$(".input-party").val()) {
      e.preventDefault();
    }
    return true;
  });

  $("button.party").on("click", function(e){

    var address = $(".address").val();

    if (!address || address.length < 6) {
      e.preventDefault();
      return shake();
    }

    $(".input-party").val($(this).data("party"));

    return true;

  });

  function shake() {
    $(".address").removeClass("shake");
    dummy.offsetWidth = dummy.offsetWidth;
    $(".address").addClass("shake");
    return false;
  }

})();

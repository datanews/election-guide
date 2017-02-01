/* global $:false, google:false, Wherewolf:false, topojson:false, URI:false */

(function(){

  var geocoder = new google.maps.Geocoder(),
      nyBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(40.49,-74.1),
        new google.maps.LatLng(41.09,-73.6)
      ),
      wolf = Wherewolf(),
      map = new google.maps.Map(document.getElementById("map"), {
          center: new google.maps.LatLng(40.6827241, -74.0248993),
          zoom: 14,
          draggable: false,
          scrollwheel: false,
          minZoom: 15,
          maxZoom: 15,
          disableDefaultUI: true,
          styles: [
            {
              "stylers": [
                { "saturation": -100 }
              ]
            },{
              "featureType": "poi",
              "stylers": [
                { "visibility": "off" }
              ]
            }
          ]
      }),
      marker = new google.maps.Marker({
        map: map,
        clickable: false
      });

  $(".address").focus();

  $.getJSON("data/districts.topo.json", ready);

  function ready(topo){

    wolf.addAll(topo);

    $("form").on("submit", function(e){
      submitted(null);
      return false;
    });

    $("button.key-races").on("click", function(e){
      e.preventDefault();
      showRacesToWatch();
      return false;
    });

    $(".candidate-top").on("click", function(){
      $(this).parent().toggleClass("open");
    });

    $("button.party").on("click", function(e){

      e.preventDefault();

      // If they click the button w/ no address, do nothing
      submitted($(this).data("party"));

      return false;

    });

    var query = (new URI()).search(true);

    if (query.address) {
      $(".address").val(query.address);

      if (query.party) {
        return submitted(query.party);
      }
    }

    $("#loading").addClass("hidden");

  }

  function submitted(party) {

    showError(null);

    // hide everything
    $("#results, .placeholder").addClass("hidden");

    // show loading
    $("#loading").removeClass("hidden");

    var address = $(".address").val().trim();

    // error, address field is blank
    if (!address || address.length < 6) {
      showError("Please enter a New York street address.");
      return false;
    }

    // prevent submission if no party has been selected
    if (!party || (party !== "D" && party !== "R")) {
      showError("Please select a political party.");
      return false;
    }

    geocoder.geocode({
      "address": address,
      "bounds": nyBounds
    }, function(results, status) {
      handleGeocode(results, status, party);
    });

    return false;

  }

  function handleGeocode(results, status, party) {

    var lnglat,
        districts = {},
        found;

    if (status != google.maps.GeocoderStatus.OK) {
      //there was a geocoder error
      showError("Please enter a valid New York street address.");
      return false;
    }

    // Filter to results in NY
    results = (results || []).filter(function(d){

      return (d.address_components || []).some(function(ac){
        return ac.long_name == "New York" && ac.short_name == "NY";
      }) && d.geometry && d.geometry.location_type !== "APPROXIMATE";

    });

    if (results.length) {
      districts = wolf.find(lnglat = [results[0].geometry.location.lng(),results[0].geometry.location.lat()]);
    }

    for (var key in districts) {
      if (districts[key]) {
        found = true;
      }
    }

    if (!results.length || !found) {
      //no matching location found in NY
      showError("Please enter a valid New York street address.");
      return false;
    }

    filterRaces(districts, party);

    $("#results, #map").removeClass("hidden");
    google.maps.event.trigger(map, "resize");
    map.setCenter({ lat: lnglat[1], lng: lnglat[0] });
    marker.setPosition({ lat: lnglat[1], lng: lnglat[0] });

    $("#loading").addClass("hidden");

  }

  function showError(message) {
    $(".error").toggle(message).text(message || "");
    $("#loading").addClass("hidden");
  }

  function showRacesToWatch() {
    $("#map, .race:not(.watch), .placeholder, #loading").addClass("hidden");
    $(".race.watch").removeClass("hidden");
    $("#results").removeClass("hidden");
  }

  function filterRaces(districts, party) {

    $(".candidate").removeClass("open");

    $(".race").each(function(){
      var $this = $(this),
          raceType = $this.data("type"),
          raceDistrict = +$this.data("district"),
          raceParty = $this.data("party"),
          raceBorough = $this.data("borough"),
          show = false;

      if (party === raceParty) {

        if (raceType === "court") {
          if (raceDistrict) {
            show = districts.court && raceDistrict === districts.court.district;
          } else {
            show = districts.borough && raceBorough === districts.borough.borough;
          }
        } else if (raceType === "slate") {
          show = districts.borough && raceBorough === districts.borough.borough && districts.assembly && raceDistrict === districts.assembly.district;
        } else {
          show = districts[raceType] && districts[raceType].district === raceDistrict;
        }

      }

      $this.toggleClass("hidden", !show);

    });

    var partyName = party === "R" ? "Republican" : "Democratic";

    ["senate", "assembly"].forEach(function(type){

      var $placeholder = $("#placeholder-" + type);

      $placeholder.removeClass("party-R party-D");

      if ($(".race-" + type + ":not(.hidden)").length === 0 && districts[type]) {
        $placeholder.find(".race-header").text("STATE " + type.toUpperCase() + " - DISTRICT " + districts[type].district);
        $placeholder.find(".race-none").text("There is no " + partyName + " primary in this district.");
        $placeholder.removeClass("hidden");
        $placeholder.addClass("party-" + party);
      }

    });

  }

})();

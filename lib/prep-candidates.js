var csv = require("dsv")(","),
    sortBy = require("sort-by"),
    _ = require("underscore");

var officeTypes = {
  "State Assembly": "assembly",
  "State Senate": "senate",
  "Manhattan Civil Court": "court",
  "Brooklyn Civil Court": "court",
  "City Council": "council"
};

module.exports = function(raw, rawSlates) {

  var rows = csv.parse(raw).filter(function(row){
    return row.ra_number && row.pol_last_name;
  });

  rows.forEach(function(row){
    if (!row.se_number.match(/^[0-9]+$/)) {
      console.warn(row);
      throw new Error("Invalid se_number");
    }
    row.seatNumber = +row.se_number;
    row.raceId = +row.ra_number;
    row.incumbent = !!row.incumbent.match(/true/i); // convert to boolean
    row.officeType = officeTypes[row.ot_name];
    row.officeName = row.ot_name + " - " + row.se_name; // clean up office name
    row.party = row.rt_party_name === "GOP" ? "R" : row.rt_party_name.toUpperCase()[0]; // simpler name
    row.first = row.pol_first_name;
    row.middle = row.pol_middle_name;
    row.last = row.pol_last_name;
    row.name = row.first + (row.middle ? " " + row.middle : "") + " " + row.last; // full name
    row.key = row.race_to_watch && !!(row.race_to_watch.trim());

    if (row.seatNumber === 0) {
      row.borough = row.ot_name.replace(/ Civil Court/,"").trim();
    }

    if (row.rt_party_name !== "GOP" && row.rt_party_name !== "Dem") {
      console.warn(row);
      throw new Error("Missing party.");
    }

    if (!row.officeType) {
      console.warn(row);
      throw new Error("Unrecognized office type.");
    }
  });

  // Group rows by race
  // Sort races by district number, then by party
  var races = _.values(_.groupBy(rows, "ra_number")).map(function(d){

    var candidates = d.sort(sortBy("last","first","middle")).map(function(row){
      return _.pick(row,"name", "first", "last", "incumbent", "website", "facebook", "twitter", "instagram", "youtube", "currently", "previously", "sentence");
    });

    var watch = "";

    var why_watch = _.uniq(_.pluck(d, "why_watch")).filter(function(d){ return (d || "").trim(); })[0] || null;
    var gg_link = _.uniq(_.pluck(d, "gg_link")).filter(function(d){ return (d || "").trim(); })[0] || null;

    var extended = _.extend(
      _.pick(d[0], "officeType", "seatNumber", "party", "officeName", "borough", "key"),
      {
        candidates: candidates,
        why_watch: why_watch,
        gg_link: gg_link
      }
    );

    return extended;

  });

  // TODO Add slates
  var slates = csv.parse(rawSlates).map(function(d){
    return {
      officeType: "slate",
      seatNumber: +d.AD,
      party: d.Party[0].toUpperCase(),
      officeName: "Judicial Delegates - District " + (+d.AD),
      borough: d.Borough,
      description: d.Description,
      numDelegates: +d.Delegates,
      delegates: d.Names.split(/\n+/g).map(function(d){ return d.trim(); })
    };
  });

  _.values(_.groupBy(slates, function(d){
    return d.party + "-"  + d.seatNumber + d.borough
  })).forEach(function(d){
    var combined = _.extend(
      _.pick(d[0], "officeType", "seatNumber", "party", "borough", "officeName", "numDelegates"),
      {
        slates: d.map(function(slate){
          return _.pick(slate, "description", "delegates")
        })
      }
    );
    races.push(combined);
  });

  var order = ["slate", "court", "council", "senate", "assembly"];

  races.sort(function(a,b){
    if (a.officeType !== b.officeType) return order.indexOf(a.officeType) - order.indexOf(b.officeType);
    if (a.seatNumber !== b.seatNumber) return a.seatNumber - b.seatNumber;
    if (a.party !== b.party) return a.party < b.party ? -1 : 1;
    return 0;
  });

  return races;

};

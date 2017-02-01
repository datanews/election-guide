# Project name

This is an edited version of the data and code that drove the [New York Voter Guide](https://project.wnyc.org/election-guide-2016-state/search.html), from [WNYC](https://wnyc.org) and [Gotham Gazette](http://www.gothamgazette.com/), for the New York State primary election in September 2016.

The voter guide gave users information about candidates on their ballot, given their home address and their party. (New York has closed primaries, so you must be registered for the party to vote in the party's primary.)

This guide, for the first time, incorporated details on judicial candidates and slates of judicial delegates -- an effort of WNYC's [Judge Your Judges](http://www.wnyc.org/series/judge-your-judges) project supported by a [prototype grant from the Knight Foundation](http://www.knightfoundation.org/grants/201551101/).

## Overview

This repo is not (yet) a collected of plug-and-play code, but is intended as an open view of how we built the [voter guide](https://project.wnyc.org/election-guide-2016-state/search.html) and a template that can be replicated and/or rewritten for other localities with minimal effort. If you'd like to embark on this, and want additional help, track down [Jenny Ye](https://github.com/thepapaya), [John Keefe](https://github.com/jkeefe), [Alan Palazzolo](https://github.com/zzolo) or [Noah Veltman](https://github.com/veltman) for guidance.

## Data

### Candidates

The tool is driven by a [Google spreadsheet](https://docs.google.com/spreadsheets/d/1CUCHm1VefAz-1JOixi16AxELsHCgrHT1TbEJvSywyO8/edit?usp=sharing), which was filled in largely by the collective work of people at WNYC and Gotham Gazette.

That spreadsheet was manually exported as a CSV, and saved as `candidates.csv` in the `data` folder.

The Gulp operation copies that data into the proper place for the deployment, and the lib/prep-candidates.js file processes that CSV.

_Note: The scaffolding for the original spreadsheet was built from candidate information provided by The Associated Press under contract with WNYC. As such, the spreadsheet you see above is missing data in many cells. The basic structure of the information and some sample data is there as a guide to AP subscribers who have access to AP election data and the `XX_pol.txt` `XX_race.text` files (where XX is the two-letter state name). For organizations without that information, alternate data could be used. dig into the `lib/prep-candidates.js` file for details on how the data are used._

### Geography

This project uses the Google Maps API to geocode an address, and then uses [wherewolf.js](https://github.com/veltman/wherewolf) to find the election districts for that location.

## Embeds

There are a couple ways for embedding.

### iframes

The more traditional approach is to use an iframe.  This does not require any JS inclusions but has the limit of having a static height.  Something like the following will work (changing slug and height as needed):

    <iframe frameborder="0" scrolling ="no" src="https://project.wnyc.org/<project-slug>/" width="100%" height="900" ></iframe>

### Dynamic heights

To embed the project but have the height of the embed to expand with content of the project we use  [Pym.js](http://blog.apps.npr.org/pym.js/).  This requires a bit more embed code and will look something like the following (changing slug and height as needed):

    <div id="election-guide-embed-id"></div>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/pym/0.4.3/pym.min.js"></script>
    <script type="text/javascript">// <![CDATA[
      (function(){
        var pymParent = new pym.Parent(
          "election-guide-embed-id",
          "https://project.wnyc.org/election-guide-2016/?pym=true",
          {}
        );
      })();
    // ]]></script>


## Development

In general, the files in the `src` directory are compiled, using values from the `content.md` file, into the `output` directory.  The `src` files are where you should make changes, and the `output` files are what you will actually view.

### Dependencies

#### Global dependencies

The following are dependencies you will need for the project but will probably already have them installed.

1. Install Git.
    * On a Mac, install Homebrew, then do: `brew install git`
1. Install NodeJS.
    * On a Mac, install Homebrew, then do: `brew install node`
1. Install Gulp: `npm install gulp -g`
1. *<include any other other global dependencies>*

#### Local dependencies

The following are steps to install dependencies that are specific to this project.

1. Install NodeJS dependencies: `npm install`

### Building

To process the files in the `src` directory into the `output` directory, run the following command:

    gulp

You can also use the following commands to help with development:

* `gulp watch`: This is a standing process that will watch for changes in `src` and compile them into `output`
* `gulp server`: This will run a small web server for development.  It will host the files in `output` at http://localhost:8080.
* `gulp develop`: Combines the `watch` and the `server` tasks.

### Testing

There are currently no automated tests.

Running the gulp server (see Building), you can visit the following in your browser for basic embedding testing:

* `[localhost:8080/testing/embed-iframe.html](http://localhost:8080/testing/embed-iframe.html)`: This will show the usual embed via an iframe.

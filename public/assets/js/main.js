/*
	Directive by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	skel.breakpoints({
		wide: '(max-width: 1680px)',
		normal: '(max-width: 1280px)',
		narrow: '(max-width: 980px)',
		narrower: '(max-width: 840px)',
		mobile: '(max-width: 736px)',
		mobilep: '(max-width: 480px)'
	});

	$(function() {

		var	$window = $(window),
			$body = $('body');

		// Disable animations/transitions until the page has loaded.
			$body.addClass('is-loading');

			$window.on('load', function() {
				$body.removeClass('is-loading');
			});

		// Fix: Placeholder polyfill.
			$('form').placeholder();

		// Prioritize "important" elements on narrower.
			skel.on('+narrower -narrower', function() {
				$.prioritize(
					'.important\\28 narrower\\29',
					skel.breakpoint('narrower').active
				);
			});

	});

})(jQuery);

var launchContainer = document.getElementById('launch-container');

$.ajax('https://api.spacexdata.com/v2/launches/upcoming', {}).success(function(data, status, jqXhr) {
  if (jqXhr.status === 200) {
    parseJson(data);
  } else {
    displayErrorMessage();
  }
}).error(function(jqXhr, textStatus, error) {
  displayErrorMessage();
});

function parseJson(json) {
  for (var i = 0; i < json.length; i++) {
    if (i >= 5) { return; }

    var flight = json[i];

		var href = flight.links.reddit_campaign;
		if (href != null) {
			console.log("href != null: " + href);
	    var link = document.createElement('a');
	    link.classList.add('launch-link');
	    link.setAttribute('href', href);
		}

    var section = document.createElement('section');
    section.classList.add('launch');

    var h4 = document.createElement('h4');
    h4.innerText = parseDate(flight.launch_date_utc) + ' UTC';

    var h3 = document.createElement('h3');
    h3.innerText = flight.rocket.rocket_name;

    var p = document.createElement('p');
    p.innerText = flight.launch_site.site_name_long;

    section.appendChild(h4);
    section.appendChild(h3);
    section.appendChild(p);

		if (href != null) {
	    link.appendChild(section);

	    launchContainer.appendChild(link);
		} else {
			launchContainer.appendChild(section);
		}
  }
}

function displayErrorMessage() {
  var p = document.createElement('p');
  p.innerText = 'Can not load any takeoffs. Please try again later.';
  p.style.textAlign = 'center';
  p.style.backgroundColor = 'white';
  launchContainer.appendChild(p);
}

function parseDate(utc) {
  var date = new Date(utc);

  var dd = date.getDate();
  if (dd < 10) {
    dd = '0' + dd;
  }

  var mm = date.getMonth() + 1;
  if (mm < 10) {
    mm = '0' + mm;
  }

  var yyyy = date.getFullYear();

  var hour = date.getHours();
  if (hour < 9) {
    hour = '0' + hour;
  }

  var min = date.getMinutes();
  if (min < 9) {
    min = '0' + min;
  }

  var dateString = dd + '.' + mm + '.' + yyyy + ' ' + hour + ':' + min;

  return dateString;
}

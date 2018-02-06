let request = require('request'),
    store = require('data-store')('spacex-takeoffs'),
    express = require('express'),
    app = express(),   
    Twit = require('twit'),
    config = { 
      twitter: {
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
      }
    },
    T = new Twit(config.twitter);

app.use(express.static('public'));

app.all('/' + process.env.BOT_ENDPOINT, function (req, res) {
  let json = {};
  
  try {
    fetchLaunchesJson((json) => {
      let launches = [];
      
      for (let i in json) {
        let launchData = json[i];

        let launch = {
          flight_number: launchData.flight_number,
          launch_date_utc: launchData.launch_date_utc,
          rocket_name: launchData.rocket.rocket_name,
          site_name_long: launchData.launch_site.site_name_long,
          reddit_campaign: launchData.links.reddit_campaign
        };
                
        launches[i] = launch;
      }
      
      checkLaunches(launches);
      
      res.json(json);
    });
  } catch(err) {
    console.log(err.message);
  }
  
});

function fetchLaunchesJson(callback) {
  request('https://api.spacexdata.com/v2/launches/upcoming', (err, res, body) => {
    if (err) {
      throw err;
    }
    
    let json = JSON.parse(body);

    callback(json);
  });
}

async function checkLaunches(launches) {
  
  for (let i = 0; i < launches.length; i++) {
    let launch = launches[i];
    
    if (isLaunchNew(launch)) {
      
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            tweet(getTweetText(launch));
            resolve();
          } catch (err) {
            console.log(err.message);
          }
        }, 5000);
      });
      
    } else {
       console.log("Not tweeting launch " + launch.flight_number); 
    }
  }
  
}

function isLaunchNew(launch) {
  let flightNumber = launch.flight_number;
  let lastTweetedFlightNumber = store.get('last-tweeted-flight-number');
  
  if (flightNumber > lastTweetedFlightNumber || lastTweetedFlightNumber === undefined) {
    store.set('last-tweeted-flight-number', flightNumber);
    
    return true;
  }
  
  return false;
}

function tweet(text) {
  console.log('Tweeting: ' + text);
  
  T.post(
    'statuses/update',
    { status: text },
    (err, data, resp) => {
      if (err) {
        throw err;
      }
    }
  );
}

function formatDateString(utc) {
  let date = new Date(utc);
  
  let dd = date.getDate();
  if (dd < 10) {
    dd = '0' + dd;
  }
  
  let mm = date.getMonth() + 1;
  if (mm < 10) {
    mm = '0' + mm;
  }
  
  let yyyy = date.getFullYear();
  
  let hour = date.getHours();
  if (hour < 9) {
    hour = '0' + hour;
  }
  
  let min = date.getMinutes();
  if (min < 9) {
    min = '0' + min;
  }
  
  let dateString = dd + '.' + mm + '.' + yyyy + ' ' + hour + ':' + min;
  
  return dateString;
}

function getTweetText(launch) {
  let name = launch.rocket_name;
  let date = formatDateString(launch.launch_date_utc) + ' UTC';
  let place = launch.site_name_long;
  let link = launch.reddit_campaign;
  
  let tags = '#SpaceX #' + name.replace(/ /g,'');
  let end = `${tags}` + (link?` Read more: ${link}`:``);
  
  let templates = [
    `${name} will launch on ${date} at the ${place}. ${end}`,
    `${name} will take off at the ${place} on ${date}. ${end}`,
    `New launch targeted for ${date}: ${name} starting from ${place}. ${end}`,
    `${date} ${name} takes off at the ${place}. ${end}`
  ];

  return templates[getRandomIntInRange(0, templates.length-1)];
}

function getRandomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let listener = app.listen(process.env.PORT, () => {
  console.log('Bot running on port ' + listener.address().port);
});
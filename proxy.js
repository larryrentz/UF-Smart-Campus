var express = require("express");
var app = express();
var IotApi = require('@arduino/arduino-iot-client');
var rp = require('request-promise');
var bodyParser = require('body-parser')

var clientID = "";
var clientSecret = "";
var streetLightThingID = "";
var smartParkerThingID = "";
var streetData = {};
var parkingData = {};

//Just a setting for enable CORS (Cross-origin resource sharing )
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//creating your object
var obj = { 
    name: 'xxxxxx', 
    value: '15324 points (level 24)'
}

//sending your object
app.get("/streetData", async function(req, res){
    await getStreetLightData();
    res.json(streetData);
});

//sending your object
app.get("/parkingData", async function(req, res){
    await getParkingData();
    res.json(parkingData);
});

//control street lights
app.post("/lightControl", async function(req, res){
    const data = JSON.stringify(req.body);
    console.log(req.body);
    var propId = data["pid"];
    var value = data["value"];
    await postLightControl(propId, value);
    res.json("Control sent!");
});

app.listen("3002", function(){
    console.log("Server is Running");
});

async function getToken() {
    var options = {
        method: 'POST',
        url: 'https://api2.arduino.cc/iot/v1/clients/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        json: true,
        form: {
            grant_type: 'client_credentials',
            client_id: clientID,
            client_secret: clientSecret,
            audience: 'https://api2.arduino.cc/iot'
        }
    };

    try {
        const response = await rp(options);
        return response['access_token'];
    }
    catch (error) {
        console.error("Failed getting an access token: " + error)
    }
}

// gets the Status of each Light and updates the UI every second
async function getStreetLightData() {
    var client = IotApi.ApiClient.instance;
    // Configure OAuth2 access token for authorization: oauth2
    var oauth2 = client.authentications['oauth2'];
    oauth2.accessToken = await getToken();
    var options = {
        'showDeleted': false
    };
    var api = new IotApi.PropertiesV2Api(client);    
    api.propertiesV2List(streetLightThingID, options).then(properties => {
        console.log(properties);
        var name;
        var value;
        for(var i = 0; i < properties.length; i++) {
            name = properties[i].name;
            value = properties[i].last_value;
            streetData[name] = value;
        }
 
    }, error => {
        console.log(error)
    });
    //setTimeout(getStreetLightData, 1000);
}

// gets the Status of each Light and updates the UI every second
async function getParkingData() {
    var client = IotApi.ApiClient.instance;
    // Configure OAuth2 access token for authorization: oauth2
    var oauth2 = client.authentications['oauth2'];
    oauth2.accessToken = await getToken();
    var options = {
        'showDeleted': false
    };
    var api = new IotApi.PropertiesV2Api(client);    
    api.propertiesV2List(smartParkerThingID, options).then(properties => {
        console.log(properties);
        var name;
        var value;
        for(var i = 0; i < properties.length; i++) {
            name = properties[i].name;
            value = properties[i].last_value;
            parkingData[name] = value;
        }
 
    }, error => {
        console.log(error)
    });
    //setTimeout(getStreetLightData, 1000);

async function postLightControl(value, propID) {
    var client = IotApi.ApiClient.instance;

    // Configure OAuth2 access token for authorization: oauth2
    var oauth2 = client.authentications['oauth2'];
    oauth2.accessToken = await getToken();

    var api = new ArduinoIotClient.PropertiesV2Api()
    var id = streetLightThingID; // {String} The id of the thing
    var pid = propID; // {String} The id of the property
    var propertyValue = value; // {PropertyValue} 
    api.propertiesV2Publish(id, pid, propertyValue).then(function() {
        console.log('API called successfully.');
        }, function(error) {
            console.error(error);
        });
    }
}

//							****** load simple map and define some icons ******
//load the map
var mymap = L.map('mapid').setView([51.505,-0.09],13);
	
//load the tiles
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',{
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,'+'<a href="http://creativecommons.org/licenses/by-sa/2.0/"> CC-BY-SA</a>,'+'imagery &copy; <a href="http://mapbox.com">Mapbox</a>', 
	id: 'mapbox.streets'
	}).addTo(mymap);

// //create a variable that will hold the XMLHttpRequest() - this must be done outside a function so that all the functions  can use the sam variable
// var client;
		
// //and a variable that will hold the layer itself - we need to do this outside the function so that we can use it to remove the layer later on
// var earthquakelayer;

// create icon template
var testMarkerRed = L.AwesomeMarkers.icon({
	icon: 'play',
	markerColor: 'red'
});
var testMarkerPink = L.AwesomeMarkers.icon({
	icon: 'play',
	markerColor: 'pink'
});



//						****** Add/Remove Earthquakes and Bus Stops function *******
 					
//create a variable that will hold the XMLHttpRequest() - this must be done outside a function so that all the functions  can use the sam variable
var client;

//and a variable that will hold the layer itself - we need to do this outside the function so that we can use it to remove the layer later on
var earthquakelayer;
var busstoplayer;

//use as global variable as they will be used to remove layers and avoid duplicate layers.
var loadingEarthquakes;
var loadingBusstops;
		
//create the code to get the Earthquakes data using an XMLHttpRequest
function getData(layername){
	autoPan = false;
	if (layername == "earthquakes" && !loadingEarthquakes){
		url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
	}else if (layername == "busstops" && !loadingBusstops){
		url = 'data/busstops.geojson'
	}else {
		alert("The layer is not loaded to the map, since it has already been existed.")
		return
	}
	//alert("Loading")
	client = new XMLHttpRequest();
	
	client.open('GET', url);
	client.onreadystatechange = dataResponse; //note don't use earthquakeResponse() with brackets as that doesn't work
	client.send();
}

//create the code to wait for the response from the data server, and process the response once it is received
function dataResponse(){
//this function listens out for the server to say that the data is ready - i.e. has state 4
	if (client.readyState == 4){
	//once the data is ready, process the data
	var geoJSONData = client.responseText;
	loadLayer(geoJSONData);
	}
}

//convert the received data - which is text - to JSON format and add it to the map
function loadLayer(geoJSONData){
	
	//convert the text to JSON
	var json = JSON.parse(geoJSONData);
	//decide which layer do we load?
	//avoid duplicate layers
	if (geoJSONData.indexOf("earthquake")>0){
		loadingEarthquakes = true;
		earthquakelayer = L.geoJson(json,
		{
			//use point to layer to create the points
			pointToLayer: function(feature, latlng){
				//look at the GeoJSON filr - specifically at the properties - to see the earthquake magnitude and use a different marker depending on this value
				//also include a pop-up that shows the place value of the earthquakes 
				if (feature.properties.mag>1.75){
					return L.marker(latlng,{icon:testMarkerRed}).bindPopup("<b> location: "+feature.properties.place+"</b>");
				}else{
				//mag is lower than 1.75
					return L.marker(latlng,{icon:testMarkerPink}).bindPopup("<b> location: "+feature.properties.place+"</b>");
				}
			}
		}).addTo(mymap);
	
		//change the map zoom so that all the data is shown
		mymap.fitBounds(earthquakelayer.getBounds());
	}else if (geoJSONData.indexOf("IIT_METHOD")>0){
		loadingBusstops = true;
		busstoplayer = L.geoJson(json).addTo(mymap)
		// zoom to bus stops
		mymap.fitBounds(busstoplayer.getBounds());
	}

}

function removeData(layername){
//check whether the layer is existed on the map or not if not inform the user.
	if (layername == "earthquakes") {
		if (loadingEarthquakes){
			//alert("removing the earthquake data here");
			mymap.removeLayer(earthquakelayer);
			loadingEarthquakes = false;
		} else {
			alert("There is no earthquake layer on the map");
		}
	}
	if (layername == "busstops") {
		if (loadingBusstops){
			//alert("removing the busstops data here");
			mymap.removeLayer(busstoplayer);
			loadingBusstops = false;
		} else {
			alert("There is no bus stop layer on the map");
		}
	}
	
}
	


	
	
//						****** Showing current location functions ******
//Tracking location
var currentLocationLyr;
var trackLOC;
var firstTime = true;
var previousBound;
var autoPan = false;

function trackLocation() {
	if (!firstTime){
	// zoom to center
		mymap.fitBounds(currentLocationLyr.getLatLng().toBounds(250));
		autoPan = true;
		
		
	} else {
		if (navigator.geolocation) {
			alert("Getting current location");
			trackLOC = navigator.geolocation.watchPosition(showPosition);
			
			
		} else {
			alert("Geolocation is not supported by this browser.");
		}
	}
}

function showPosition(position) {

	if(!firstTime){
		mymap.removeLayer(currentLocationLyr);
	}
	currentLocationLyr = L.marker([position.coords.latitude,position.coords.longitude]).addTo(mymap);
	
	if(firstTime){
		firstTime = false;
		mymap.fitBounds(currentLocationLyr.getLatLng().toBounds(250));
		autoPan = true;
	}else if (autoPan) {
		mymap.panTo(currentLocationLyr.getLatLng());
		
	}	
}

//turn off autoPan when user drag the map.
mymap.on('dragstart', function() {
	autoPan = false;
})


function alertAuto(){
	alert(autoPan);
	
}


//	****** Distance alert functions ******

//These parameters are used to decide when the application alerts user.
var watch_dist;
var firstTimeDist = true;
var prev_closestPt = "";
var inbound;
var cutoffDist = 1; // kilometers
var pts = [ [1,51.524616,-0.13818,"Warren Street"], //id, lat, lon, name
			[2,51.5567,-0.1380,"Tufnell Park"],
			[3,51.5592,-0.1342,"Tufnell House"] ];


function trackDistance() {
if (navigator.geolocation) {
		watch_dist = navigator.geolocation.watchPosition(getAlertFromPoints);
	} else {
		alert("Geolocation is not supported by this browser.");
	}
}


function getAlertFromPoints(position){
	var closestDist = cutoffDist;
	var closestPt = "outside";
	var curLat = position.coords.latitude;
	var curLon = position.coords.longitude;
	//find the closest point within the cut-off distance
	for (var i = 0; i < pts.length; i++) {
		if( closestDist > calculateDistance(curLat, curLon, pts[i][1], pts[i][2],'K')){
			closestDist = calculateDistance(curLat, curLon, pts[i][1], pts[i][2],'K');
			closestPt = pts[i][3];
		}
	}
	if (prev_closestPt != closestPt){
		alert("Your closest point is: " + closestPt);
		prev_closestPt = closestPt
	}
	//find the coordinates of a point using this website:
	//these are the coordinates for Warren Street
	var lat = 51.524616;
	var lon = -0.13818;
	//return the distance in kilometers
	var distance = calculateDistance(position.coords.latitude,position.coords.longitude,lat,lon,'K');
	//document.getElementById('showDistance').innerHTML =  "Distance:" +distance +"km";
	
	// //alert the status if it is the first time and 
	// if (firstTimeDist == true){
		// firstTimeDist = false;
		// if (distance > radius){
			// inbound = false;
			// alert("You are outside the boundary");
		// } else {
			// inbound = true;
			// alert("You are inside the boundary");
		// }
	// } else { //alert when device travel out of or into the boundary
		// if ((inbound) && distance > radius) {
			// alert("You just travel out of the boundary");
			// inbound = false;
		// } else if ((!inbound) && distance <= radius) {
		
			// alert("You just travel into the boundary");
			// inbound = true;
		// }
	// }
}


//code adapted from https//www.htmlgoodies.com/beyond/javascript/calculate-the-distance-between-two-points-in-your-web-apps.html
function calculateDistance(lat1,lon1,lat2,lon2,unit){
	var radlat1=Math.PI*lat1/180;
	var radlat2=Math.PI*lat2/180;
	var radlon1=Math.PI*lon1/180;
	var radlon2=Math.PI*lon2/180;
	var theta = lon1-lon2;
	var radtheta = Math.PI * theta/180;
	var subAngle = Math.sin(radlat1)*Math.sin(radlat2)+Math.cos(radlat1)*Math.cos(radlat2)*Math.cos(radtheta);
	subAngle = Math.acos(subAngle);
	subAngle = subAngle*180/Math.PI; //convert the degree value returned by acos back to degrees from radians
	dist = (subAngle/360)*2*Math.PI*3956;// ((subtended angle in degrees)/360)*2*pi*radius)
										//where radius of the earth is 3956 miles
	if(unit=='K'){dist=dist*1.609344;}//convert miles to km
	if(unit=='N'){dist=dist*0.8684;}//convert to nautical miles
	return dist;
}








//					****** Switches functions ******

//Earthquakes switch
var EQbox = document.getElementById("EQbox");	
function EQ()	{
//add a point
	if (EQbox.checked){
		getData('earthquakes');
	} else {
		removeData('earthquakes');
	}
}

//Bus switch
var Busbox = document.getElementById("Busbox");	
function bus()	{
//add a point
	if (Busbox.checked){
		getData('busstops');
	} else {
		removeData('busstops');
	}
}

//Current location switch
var locationBox = document.getElementById("locationBox");	
function currentLocation()	{
//add a point
	if (locationBox.checked){
		trackLocation();
	} else {
		navigator.geolocation.clearWatch(trackLOC);
		mymap.removeLayer(currentLocationLyr);
		firstTime = true;
		autoPan = false;
		
	}
}

//alert dist switch
var distBox = document.getElementById("distBox");
function distAlert(){
	if (distBox.checked){
		if (!locationBox.checked){
			locationBox.checked = true;
			currentLocation();
		}
		trackDistance();
	} else {
		navigator.geolocation.clearWatch(watch_dist);
		prev_closestPt = "";
		
	}
}



//UCL switch
var UCL;
var UCLbox = document.getElementById("UCLbox");	
function UCLpoint()	{
//add a point
	if (UCLbox.checked){
		autoPan = false;
		UCL = L.marker([51.5,-0.09]).addTo(mymap).bindPopup("<b>Hello world!</b><br/>I am a popup.<br/><a href='http://www.ucl.ac.uk'>Go to UCL website</a>").openPopup();
		mymap.flyToBounds(UCL.getLatLng().toBounds(500));
	} else {
		mymap.removeLayer(UCL);
	}
}
	
//add a circle
var circle;
var circle_box = document.getElementById("circle_box");		
function addCircle(){
	if (circle_box.checked){
		autoPan = false;
		circle = L.circle([51.508,-0.11],500,{
			color: 'red',
			fillColor: '#f03',
			fillOpacity: 0.5
		}).addTo(mymap).bindPopup("I am a circle.");
		mymap.flyToBounds(circle);
	} else {
		mymap.removeLayer(circle);
	}
	
}
		
//add a polygon with 3 end points (i.e. a triangle)
var myPolygon;
var poly_box = document.getElementById("poly_box");	
function addPolygon(){
	if (poly_box.checked){
		autoPan = false;
		myPolygon = L.polygon([
			[51.509,-0.08], 
			[51.503,-0.06], 
			[51.51,-0.047]
		],{
			color: 'blue',
			fillColor: '#096aea',
			fillOpacity: 0.2
		}).addTo(mymap).bindPopup("I am a polygon.");
		mymap.flyToBounds(myPolygon);
		
	} else {
		mymap.removeLayer(myPolygon);
	}
}

function panToCurrentLoc(){
	if (!firstTime) {
		trackLocation();
	}
}


//Testing AJAX
var xhr; //define the globle to process the AJAX request
function callDivChange(){
	xhr = new XMLHttpRequest();
	//var filename = document.getElementById("filename").value;
	//xhr.open("GET","./"+filename,true);
	xhr.open("GET","https://developer.cege.ucl.ac.uk:31083/dir1/dir2/dir3/dir4/dir5/test5.html",true);
	//xhr.open("GET",".test.html",true);
	xhr.onreadystatechange = processDivChange;
	try{
		xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	}
	catch(e){
		//this only works in internet explorer
	}
	xhr.send();
	
}

function processDivChange(){
	//while waiting response from server
	if(xhr.readyState <4)  document.getElementById('ajaxtest').innerHTML="Loading...";
	///4 = response from server has been completely loaded.
	else if (xhr.readyState === 4){
		//200-300 --> all successful
		if (xhr.status==200&&xhr.status<300) document.getElementById('ajaxtest').innerHTML=xhr.responseText;
	}
}






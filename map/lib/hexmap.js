function initializeMap(center, startZoom, maxZoom) {
    var osmUrl    = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap<\/a> contributors',
        osmLayer  = L.tileLayer(osmUrl, {maxZoom: maxZoom, attribution: osmAttrib});

    var map = new L.Map('map', {layers: [osmLayer], center: center, zoom: startZoom});

    return [ map, osmLayer ];
}

function addHexbinLayer(map, data, radius) { 
    var options = {
        radius: radius,
        opacity: 0.5,
        duration: 200,
        lng: function(d){
            return d[0];
        },
        lat: function(d){
            return d[1];
        },
        value: function(d){
            var sum = 0, sum2 = 0;
            d.forEach(function (datum) {
                    sum += datum.o[2];
                    //sum += datum.o[2] / datum.o[3];
                    //sum2 += datum.o[3];
                });
            var mean = sum / d.length;
            //var mean = sum / d.length * sum2;
            return mean;
        }//,
        //valueFloor: _.min(vals), // I think these are currently ignored
        //valueCeil:  _.max(vals)
    };

    var hexLayer = L.hexbinLayer(options).addTo(map)
    hexLayer.data(data);
    return hexLayer;
}

function HexMap () {
    this.locked = false;
    this.requests = [];
    this.results = [];
    this.data = [];
}

HexMap.prototype.getWeekNumber = function(d) {
    // Copy date so don't modify original
    d = new Date(+d);
    d.setHours(0,0,0,0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(),0,1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return [d.getFullYear(), weekNo];
}

HexMap.prototype.getDataBetweenDates = function(date1, date2) {
    if (this.locked) {
        return
    }
    this.locked = true;
    weekNum1 = this.getWeekNumber(date1)
    console.log(weekNum1);
    weekNum2 = this.getWeekNumber(date2)
    console.log(weekNum2);

    this.requests = [];
    this.results = [];
    for (var i = weekNum1[0]; i <= weekNum2[0]; i++) {
        //console.log("i", i);
        var startWeek, endWeek 
        if (i == weekNum1[0]) {
            startWeek = weekNum1[1];
        } else {
            startWeek = 1;
        }
        if (i<weekNum2[0]) {
            var tmp = this.getWeekNumber(new Date(i, 11, 31, 0, 0, 0, 0));
            //console.log("tmp", tmp);
            endWeek = tmp[1];
        } else {
            endWeek = weekNum2[1]
        }
        //console.log("startWeek", startWeek);
        //console.log("endWeek", endWeek);
        for (var j = startWeek; j <= endWeek; j++) {
            //console.log("j: " + j);
            var fileName = "data_" + i + "_" + j + ".json";
            // console.log("fileName", fileName);
            this.requests.push(this.getDataFile(fileName));
        }
    }
}

HexMap.prototype.getDataFile = function(file){
    //var url='https://localhost:8081/data/' + file;
    var url='/data/' + file;
    var that = this;
    return $.ajax({
        url: url
        }).done(function(data) {
        //console.log("data", data);
        console.timeStamp("done");
        that.results.push(data.values)
        that.checkForRender();
    }).fail(function(e) {
        //console.log("e", e);
        console.timeStamp("fail");
        that.results.push(null)
        that.checkForRender();
    });
}

HexMap.prototype.checkForRender = function() {
    if (this.results.length < this.requests.length) {
        return;
    }
    console.log(this.results.length + " of " + this.requests.length + " returned");
    console.log("gogogo");

    this.data = [];

    var count = 0;
    for (var i = this.results.length - 1; i >= 0; i--) {
        if (this.results[i] == null) {
            continue;
        }

        var values = this.results[i]
        for (var j = values.length - 1; j >= 0; j--) {
            this.data[count] = values[j];
            count++;
        }

    }

    this.renderMap();
    // console.log("_.min(lats)", _.min(lats));
    // console.log("_.max(lats)", _.max(lats));
    // console.log("_.min(lngs)", _.min(lngs));
    // console.log("_.max(lngs)", _.max(lngs));
    this.locked = false;
}

HexMap.prototype.renderMap = function() {
    var lngs = [], lats = [], vals = [], accuracy = [], count = 0;

    var timerange = $("#timerange").val();
    var accuracy = $("#accuracy").val();

    var d = new Date();
    d.setDate(d.getDate() - timerange*7);
    var time = d.getTime() / 1000;

    var values = this.data
    for (var j = values.length - 1; j >= 0; j--) {
        if (values[j].accuracy > accuracy || values[j].time < time) {
            continue;
        }
        lngs[count] = values[j].longitude;
        lats[count] = values[j].latitude;
        vals[count] = values[j].rssi;
        accuracy[count] = values[j].accuracy;
        //console.log("lngs["+i+"]", lngs[i]);
        count++;
    }

    console.log("count: " + count);
    if(this.hexbinLayer != null) {
        map.removeLayer(this.hexbinLayer);
        this.hexbinLayer = null;
    }

    if(count > 0) {
        this.hexbinLayer = addHexbinLayer(map, _.zip(lngs, lats, vals, accuracy), 10);        
    }
}

$(document).ready(function(){
    var coords_goe = [ 51.549775, 9.9297669 ];

    var init = initializeMap(coords_goe, 15, 19);
    map = init[0];
    osm = init[1];

    var hexmap = new HexMap();
    console.log("HexMap", hexmap);
    //hexmap.getDataBetweenDates(new Date(2016, 10, 1, 0, 0, 0, 0), new Date());

    $("input.map_control").on("change", function() {
        console.log("input.map_control change");
        var timerange = $("#timerange").val();
        $("#timerangelabel").html($("#timerangelabel").attr("data-label") + timerange + " Wochen");
        var accuracy = $("#accuracy").val();
        $("#accuracylabel").html($("#accuracylabel").attr("data-label") + accuracy + "m");

        if($(this).hasClass("map_data")) {
            console.log("map_data");
            console.log(timerange);
            var d = new Date();
            d.setDate(d.getDate() - timerange*7);
            hexmap.getDataBetweenDates(d, new Date());
        } else if($(this).hasClass("map_filter")) {
            console.log("map_filter");
            hexmap.renderMap();
        }
    });
    $("#timerange").trigger("change");
});
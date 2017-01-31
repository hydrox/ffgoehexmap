function HexMap () {
    this.locked = false;
    this.requests = [];
    this.results = [];
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
            console.log("fileName", fileName);
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


    var lngs = [], lats = [], vals = [], accuracy = [], count = 0;

    for (var i = this.results.length - 1; i >= 0; i--) {
        if (this.results[i] == null) {
            continue;
        }
        var values = this.results[i]
        for (var j = values.length - 1; j >= 0; j--) {
            if (values[j].accuracy > 10) {
                continue;
            }
            lngs[count] = values[j].longitude;
            lats[count] = values[j].latitude;
            vals[count] = values[j].rssi;
            accuracy[count] = values[i].accuracy;
            //console.log("lngs["+i+"]", lngs[i]);
            count++;
        }
    }

    var hexbinLayer = addHexbinLayer(map, _.zip(lngs, lats, vals, accuracy), 15);

    console.log("_.min(lats)", _.min(lats));
    console.log("_.max(lats)", _.max(lats));
    console.log("_.min(lngs)", _.min(lngs));
    console.log("_.max(lngs)", _.max(lngs));
}
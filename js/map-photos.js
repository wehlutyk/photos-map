$(function() {
  var photosMap = {};

  photosMap.buildDate = function(dateString) {
    var dayMonthYear = dateString.split('/');
    return new Date(dayMonthYear[2], dayMonthYear[1], dayMonthYear[0]);
  };

  photosMap.showHidePhotos = function() {
    for (var i = 0; i < this.l; i++) {
      var pDate = this.buildDate(this.ps[i].date);
      if (this.dateFrom && (pDate < this.dateFrom)) {
        if (this.shown[i]) {
          this.map.removeLayer(this.markers[i]);
          this.shown[i] = false;
        }
      } else {
        if (this.dateUntil && (this.dateUntil < pDate)) {
          if (this.shown[i]) {
            this.map.removeLayer(this.markers[i]);
            this.shown[i] = false;
          }
        } else {
          if (! this.shown[i]) {
            this.markers[i].addTo(this.map);
            this.shown[i] = true;
          }
        }
      }
    }
  };

  var onCloseDateFrom = function(dateString) {
    this.dateFrom = this.buildDate(dateString);
    this.showHidePhotos();
  };

  var onCloseDateUntil = function(dateString) {
    this.dateUntil = this.buildDate(dateString);
    this.showHidePhotos();
  };

  $('#date-from').datepicker({
    dateFormat: 'dd/mm/yy',
    onClose: $.proxy(onCloseDateFrom, photosMap)
  });

  $('#date-until').datepicker({
    dateFormat: 'dd/mm/yy',
    onClose: $.proxy(onCloseDateUntil, photosMap)
  });

  $.ajax({
    url: "photos.json",
    context: photosMap
  }).done(function(response) {
    this.map = L.map('map');
    L.tileLayer('http://{s}.tile.cloudmade.com/37ea7ab231f4485899a07a6728d83544/997/256/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
      maxZoom: 25
    }).addTo(this.map);

    var p, marker,
        sum_latitudes = 0,
        sum_longitudes = 0;
    this.l = response.photos.length,
    this.ps = [],
    this.markers = [];
    this.shown = [];

    for (var i = 0; i < this.l; i++) {
      p = response.photos[i];
      this.ps.push(p);

      sum_latitudes += p.latitude;
      sum_longitudes += p.longitude;

      marker = L.marker([p.latitude, p.longitude],
        {opacity: 0.8, riseOnHover: true}).addTo(this.map);
      marker.bindPopup(
        '<h3>' + p.title + '</h3>' +
        '<p><strong>' + p.date + '</strong> ' +
        '— <em>In folder <a href="' + p.folder + '">' + p.folder + '</a></em></p>' +
        '<p><a href="' + p.url_small + '">' + '<img src="' + p.url_preview + '" height="300" width="400" alt="' + p.title + '"/></a></p>' +
        '<p><em>View in <a href="' + p.url_small + '">small size (' + p.size_small + ')</a>, ' +
        '<a href="' + p.url_full + '">full size (' + p.size_full + ')</a></em></p>',
        {maxWidth: 500}
      );

      this.markers.push(marker);
      this.shown.push(true);
    }

    this.map.setView([sum_latitudes/this.l, sum_longitudes/this.l], 10)
  }).fail(function() {
    alert("Oops, there was an error loading the photos' information...")}
  );
});

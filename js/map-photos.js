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

  photosMap.iconActive = new L.Icon.Default({iconUrl: 'lib/leaflet/images/marker-icon-active.png'});
  photosMap.iconInactive = new L.Icon.Default();

  photosMap.folderListUpdate = function() {
    var photoRow, k;
    var folderName = this.folderLink.html();
    var photosTable = $('#photos-table-content');
    photosTable.html('');

    if (this.oldFolderLi.length) {
      var oldFolderName = this.oldFolderLi.children().html();
      for (var i in this.folders[oldFolderName]) {
        k = this.folders[oldFolderName][i];
        this.markers[k].setIcon(this.iconInactive);
      }
    }

    for (var i in this.sortedIndexes[folderName]) {
      k = this.sortedIndexes[folderName][i].index;
      photoRow = $('<tr></tr>', {'class': 'photo-name clickable'});
      photoRow.html('<td>' + this.ps[k].title + '</td><td><em>' + this.ps[k].date + '</em></td>');
      if (! this.shown[k]) {
        photoRow.addClass('error');
        photoRow.removeClass('clickable');
      }
      photosTable.append(photoRow);
      this.markers[k].setIcon(this.iconActive);
    }

    $('#photos-table-content').dequeue();
  };

  photosMap.onClickFolderName = function(event) {
    event.preventDefault();

    this.folderLink = $(event.target);
    var folderLi = this.folderLink.parent();
    this.oldFolderLi = folderLi.parent().children('.active');
    this.oldFolderLi.toggleClass('active');
    folderLi.toggleClass('active');

    if (! this.folderTableShown) {
      this.folderTableShown = true;
      this.folderListUpdate();
      $('#photos-table-head').fadeIn(400);
    } else {
      $('#photos-table-content').fadeOut(400, $.proxy(this.folderListUpdate, this));
    }

    $('#photos-table-content').fadeIn(400);
  };

  photosMap.onClickPhotoName = function(event) {
    event.preventDefault();

    var photoRow = $(event.target);
    var photoRowIndex = photoRow.parent().index();
    var folderName = $('#navigation-folders-list').children('.active').children().html();
    var markerIndex = this.sortedIndexes[folderName][photoRowIndex].index;
    this.markers[markerIndex].openPopup();
  };

  photosMap.onCloseDateFrom = function(dateString) {
    this.dateFrom = this.buildDate(dateString);
    this.showHidePhotos();
    $('#navigation-folders-list').children('.active').children().trigger('click');
  };

  photosMap.onCloseDateUntil = function(dateString) {
    this.dateUntil = this.buildDate(dateString);
    this.showHidePhotos();
    $('#navigation-folders-list').children('.active').children().trigger('click');
  };

  $('#date-from').datepicker({
    dateFormat: 'dd/mm/yy',
    onClose: $.proxy(photosMap.onCloseDateFrom, photosMap)
  });

  $('#date-until').datepicker({
    dateFormat: 'dd/mm/yy',
    onClose: $.proxy(photosMap.onCloseDateUntil, photosMap)
  });

  $.ajax({
    url: "photos.json",
    context: photosMap
  }).done(function(response) {
    // Create base map
    this.map = L.map('map');
    L.tileLayer('http://{s}.tile.cloudmade.com/37ea7ab231f4485899a07a6728d83544/997/256/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
      maxZoom: 25
    }).addTo(this.map);

    // Add all markers
    var p, marker, imageFormat,
        sum_latitudes = 0,
        sum_longitudes = 0;
    this.l = response.photos.length,
    this.ps = [],
    this.markers = [];
    this.shown = [];
    this.folders = {};
    this.folderNames = [];
    this.sortedIndexes = [];

    for (var i = 0; i < this.l; i++) {
      p = response.photos[i];
      this.ps.push(p);

      sum_latitudes += p.latitude;
      sum_longitudes += p.longitude;

      if (p.rotation) {
        imageFormat = ' height="400" width="300"';
      } else {
        imageFormat = ' height="300" width="400"';
      }

      marker = L.marker([p.latitude, p.longitude],
        {opacity: 0.8, riseOnHover: true, title: p.title}).addTo(this.map);
      marker.bindPopup(
        '<h3>' + p.title + '</h3>' +
        '<p><strong>' + p.date + '</strong> ' +
        '— <em>In folder <a href="' + p.folder + '">' + p.folder + '</a></em></p>' +
        '<p><a href="' + p.url_small + '">' + '<img src="' + p.url_preview + '"' + imageFormat + ' alt="' + p.title + '" /></a></p>' +
        '<p><em>View in <a href="' + p.url_small + '">small size (' + p.size_small + ')</a>, ' +
        '<a href="' + p.url_full + '">full size (' + p.size_full + ')</a></em></p>',
        {maxWidth: 500}
      );

      this.markers.push(marker);
      this.shown.push(true);

      if (! this.folders.hasOwnProperty(p.folder)) {
        this.folders[p.folder] = [];
        this.sortedIndexes[p.folder] = [];
        this.folderNames.push(p.folder);
      }
      this.folders[p.folder].push(i);
      this.sortedIndexes[p.folder].push({index: i, title: p.title});
    }

    this.folderNames.sort();
    for (var i in this.folderNames) {
      this.sortedIndexes[this.folderNames[i]].sort(function(a, b) {return parseInt(a.title.slice(0, 2)) > parseInt(b.title.slice(0, 2));});
    }

    // Fill up the folders and photos
    var folderList = $('#navigation-folders-list'),
        folderItem;
    for (var i in this.folderNames) {
      folderItem = $('<li></li>');
      folderItem.html('<a href="#" class="folder-name">' + this.folderNames[i] + '</a>');
      folderList.append(folderItem);
    }
    folderList.on('click', '.folder-name', $.proxy(this.onClickFolderName, this));
    $('#navigation-photos').on('click', '.photo-name.clickable', $.proxy(this.onClickPhotoName, this));

    // Show the map
    this.map.setView([sum_latitudes/this.l, sum_longitudes/this.l], 10)
    this.onCloseDateFrom($('#date-from').val());
    this.onCloseDateUntil($('#date-until').val());
  }).fail(function() {
    alert("Oops, there was an error downloading the photo data...")}
  );
});

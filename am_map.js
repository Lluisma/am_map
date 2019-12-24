/*!
 * A jQuery plugin to quickly create a leaflet map and add multiple interactive layers of points (using LatLong or UTM(x,y) coords).
 * Tested in Leaflet 1.5.1
 * Date: 2019-12-24
 */

 
(function ( $ ) {
	
	$.fn.am_map = function( param1 = null, param2 = null ) {

		if ( am_map_methods[param1] ) {

			return am_map_methods[ param1 ].apply( this, Array.prototype.slice.call( arguments, 1 ));

	  	} else if ( typeof param1 === 'object' || ! param1 ) {						// Default to "init"
			
			return am_map_methods.init.apply( this, arguments );

	  	} else {

			$.error( '** AM_MAP WARNING ** Method ' +  param1 + ' does not exist on jQuery.tooltip' );
			return this;

		}    
							
	};


	// Plugin defaults – added as a property on our plugin function.

	$.fn.am_map.defaults = {
		center:      [41.55, 2.45],
		height:      '400px',
		background:  'terrain',
		iniZoom:     12
	};


	// Plugin methods

	var am_map_methods = {

		init : function(opts) {

			var map = this.data("map");
		
			if (!map) {

				if ($(this).length>0) {
				
					// Extend our default options with those provided.
					var options = $.extend( {}, $.fn.am_map.defaults, opts );
		
					this.data("options", options);		
		
					// Create map
		
					var divMap = $(this)[0].id;
		
					$(this).height( options.height );
					
					if (options.background=='osm') {
						var bgLayer = new L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
					} else {
						var bgLayer = new L.StamenTileLayer( options.background );
					}		
				
					var map = new L.Map(divMap, {
											center: new L.LatLng( options.center[0], options.center[1] ),
											zoom:   options.iniZoom,
											layers: [bgLayer],
										});
		
					this.data("map", map);
					this.data("layers", []);

				} else {

					console.log( '** AM_MAP WARNING ** There isn\'t any ' + $(this).selector + ' element in the document.' );

				}
	
			}

			return this;

		},

		addLayer : function( params ) {  

			if (!this.data("map")) {
				am_map_methods.init.apply( this );
			}

			var map     = this.data("map");			
			var options = this.data("options");

			var layers  = this.data("layers");
			var layer_name = params.name;

			if (layers.indexOf(layer_name) === -1 ) {
				layers.push(layer_name);
			}

			var pt_opts = (params.icon) ? { icon: L.divIcon( { className: 'custom-div-icon', html: params.icon } ) } : {};

			var southH = (params.UTMsouth) ? params.UTMsouth : false;

			var pts  = ( Array.isArray(params.points[0]) ) ? params.points : [ params.points ];
			var code = [];
			var name = [];

			// Remove layer if exists

			if (this.data(layer_name)) {
				map.removeLayer( this.data(layer_name) );
			}

			var arrMarkers = new Array();
			var center;

			pts.forEach( function(pt, idx) { 

				// Convert UTM coords to LatLong if needed

				if (params.UTMzone) {
					var item = L.utm({x: pt[0], y: pt[1], zone: params.UTMzone, southHemi: southH });
					var point = item.latLng();
				} else {
					var point = [ pt[0], pt[1] ];
				}
				
				var marker_opts = pt_opts;
				if (pt[2]) { marker_opts.code = pt[2]; }
				if (pt[3]) { marker_opts.name = pt[3]; }

				arrMarkers.push( L.marker(point, marker_opts) );  

				center = point;

			});
				
			var markers = new L.featureGroup( arrMarkers );	

			// Click and PopUp events

			markers.on('click', function(e) {
				var elementObj = this._layers[e.layer._leaflet_id];
				if ((elementObj.options.code) && (params.url)) {
					location.href = params.url + elementObj.options.code;
				}
			 }).on('mouseover', function (e) {
				var elementObj = this._layers[e.layer._leaflet_id];
				if (elementObj.options.name) {
					elementObj.bindPopup( elementObj.options.name + '' ).openPopup();
				}
        	}).on('mouseout', function (e) {
				var elementObj = this._layers[e.layer._leaflet_id];
            elementObj.closePopup();
			});
				
			// Zooms on first layer

			if (layer_name==layers[0]) {	

				if (arrMarkers.length==1) {
					map.setView( center, options.iniZoom );
				} else {
					map.fitBounds(markers.getBounds());
				}

			}

			// If zoom level is defined controls layer visualization

			if (params.limitZoom) {

				map.on('zoomend', function() {
					if (map.getZoom() < params.limitZoom){
						map.removeLayer(markers);
					}
					else {
						map.addLayer(markers);
					}
				});

			} else {

				this.data(layer_name, markers.addTo( map ) );

			}

			return this;

		}
  	};

}( jQuery ));

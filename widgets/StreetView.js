define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dojo/aspect',
    'dojo/topic',
    'esri/layers/GraphicsLayer',
    'esri/Graphic',
    'esri/renderers/SimpleRenderer',
    'dojo/text!./StreetView/templates/StreetView.html',
    'esri/symbols/TextSymbol',
    'dojo/dom-style',
    'dojo/dom-geometry',
    'esri/geometry/Point',
    'esri/geometry/SpatialReference',
    'dijit/MenuItem',
    'proj4js/proj4',
    'dojo/i18n!./StreetView/nls/resource',
    'gis/plugins/Google',
    'dijit/form/ToggleButton',
    'xstyle/css!./StreetView/css/StreetView.css'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, aspect, topic, GraphicsLayer, Graphic, SimpleRenderer, template, TextSymbol, domStyle, domGeom, Point, SpatialReference, MenuItem, proj4, i18n, Google) {
    //cache google so
    var google = null;
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: template,
        i18n: i18n,
        mapViewClickMode: null,

        panoOptions: null,

        textSymbolOptions: {
            horizontalAlignment: 'center',
            verticalAlignment: 'middle', 
            angle: 315,
            color: [0, 150, 220],
            text: '\uf124',
            xoffset: 0,
            yoffset: 0,
            font: {
                size: 16,
                family: 'Font Awesome\\ 5 Free',
                weight: 'normal'
            }
        },

        // in case this changes some day
        proj4BaseURL: 'https://epsg.io/',

        //  options are ESRI, EPSG and SR-ORG
        // See http://sepsg.io/ for more information
        proj4Catalog: 'EPSG',

        // if desired, you can load a projection file from your server
        // instead of using one from epsg.io
        // i.e., http://server/projections/102642.js
        proj4CustomURL: null,

        postCreate: function () {
            this.inherited(arguments);
            //load the google api asynchronously
            Google.load(lang.hitch(this, function (g) {
                //store a reference to google
                google = g;

                //init our panoOptions since they depend on google
                this.panoOptions = {
                    addressControlOptions: {
                        position: google.maps.ControlPosition.TOP_RIGHT
                    },
                    linksControl: false,
                    panControl: false,
                    zoomControlOptions: {
                        style: google.maps.ZoomControlStyle.SMALL
                    },
                    enableCloseButton: false
                };
                this.createGraphicsLayer();
				
		//this.map.on('click', lang.hitch(this, 'getStreetView'));
		//this.view.on('click', lang.hitch(this, function (evt) {
		//    if (evt.button == 2) {
                //	this.getStreetView(evt.mapPoint, true);
		//    }
		//}));	

                this.view.on('click', lang.hitch(this, 'getStreetView'));

                this.own(topic.subscribe('mapViewClickMode/currentSet', lang.hitch(this, 'setMapViewClickMode')));

                if (this.parentWidget) {
                    if (this.parentWidget.toggleable) {
                        this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function () {
                            this.onLayoutChange(this.parentWidget.open);
                        })));

                        // trigger layout change since parentWidget might
                        // already be open
                        this.onLayoutChange(this.parentWidget.open);
                    }
                    this.own(aspect.after(this.parentWidget, 'resize', lang.hitch(this, 'resize')));
                    this.own(topic.subscribe(this.parentWidget.id + '/resize/resize', lang.hitch(this, 'resize')));
                }

                if (!window.proj4) {
                    window.proj4 = proj4;
                }

                if (this.mapViewRightClickMenu) {
                    this.addRightClickMenu();
                }
            }));
        },
        createGraphicsLayer: function () {
            this.pointSymbol = new TextSymbol(this.textSymbolOptions);
            this.originalAngle = this.pointSymbol.angle;
            this.pointGraphics = new GraphicsLayer({
                id: 'streetview_graphics',
                title: 'Street View'
            });
            this.pointRenderer = new SimpleRenderer(this.pointSymbol);
            this.pointRenderer.label = 'Street View';
            this.pointRenderer.description = 'Street View';
            this.pointGraphics.renderer = this.pointRenderer;
            this.view.map.add(this.pointGraphics);
        },
        addRightClickMenu: function () {
            //this.map.on('MouseDown', lang.hitch(this, function (evt) {
            //    this.mapRightClickPoint = evt.mapPoint;
            //}));
			
	    this.view.on('click', lang.hitch(this, function (evt) {
                if (evt.button == 2) {
                    this.mapViewRightClickPoint = evt.mapPoint;
                }
            }));			
			
            this.mapViewRightClickMenu.addChild(new MenuItem({
                label: this.i18n.rightClickMenuItem.label,
                onClick: lang.hitch(this, 'streetViewFromMapRightClick')
            }));
        },
        onOpen: function () {
            this.pointGraphics.visible = true;
        },
        onClose: function () {
            // end streetview on close of title pane
            this.pointGraphics.visible = false;
            if (this.mapViewClickMode === 'streetview') {
                this.connectMapClick();
            }
        },
        onLayoutChange: function (open) {
            if (open) {
                this.onOpen();
            } else {
                this.onClose();
            }
        },
        placePoint: function () {
            if (this.streetViewButtonDijit.get('checked')) {
                this.disconnectMapClick();
            } else {
                this.connectMapClick();
            }
            //get map click, set up listener in post create
        },
        disconnectMapClick: function () {
            this.streetViewButtonDijit.set('checked', true);
            this.view.cursor = 'crosshair';
            topic.publish('mapViewClickMode/setCurrent', 'streetview');
        },
        connectMapClick: function () {
            this.streetViewButtonDijit.set('checked', false);
            this.view.cursor = 'auto';
            topic.publish('mapViewClickMode/setDefault');
        },
        clearGraphics: function () {
            this.pointGraphics.clear();
            domStyle.set(this.noStreetViewResults, 'display', 'block');
        },
        enableStreetViewClick: function () {
            this.disconnectMapClick();
        },
        disableStreetViewClick: function () {
            this.connectMapClick();
        },
        getStreetView: function (evt, overRide) {
            if (this.mapViewClickMode === 'streetview' || overRide) {
                var mapPoint = evt.mapPoint;
                if (!mapPoint) {
                    return;
                }

                if (this.parentWidget && !this.parentWidget.open && this.parentWidget.toggleable) {
                    this.parentWidget.toggle();
                }

                // convert the map point's coordinate system into lat/long
                var geometry = null,
                    wkid = mapPoint.spatialReference.wkid;
                if (wkid === 102100) {
                    wkid = 3857;
                }
                var key = this.proj4Catalog + ':' + String(wkid);
                if (!proj4.defs[key]) {
                    var url = this.proj4CustomURL || this.proj4BaseURL + String(wkid) + '.js';
                    require([url], lang.hitch(this, 'getStreetView', evt, true));
                    return;
                }
                // only need one projection as we are
                // converting to WGS84 lat/long
                var projPoint = proj4(proj4.defs[key]).inverse([mapPoint.x, mapPoint.y]);
                if (projPoint) {
                    geometry = {
                        x: projPoint[0],
                        y: projPoint[1]
                    };
                }

                domStyle.set(this.streetViewInstructions, 'display', 'none');
                if (geometry) {
                    domStyle.set(this.noStreetViewResults, 'display', 'none');
                    this.getPanoramaLocation(geometry);
                } else {
                    this.setPanoPlace = null;
                    this.clearGraphics();
                    domStyle.set(this.noStreetViewResults, 'display', 'block');
                }
            }

        },
        getPanoramaLocation: function (geoPoint) {
            var place = new google.maps.LatLng(geoPoint.y, geoPoint.x);
            if (!this.panorama || !this.panoramaService) {
                this.panorama = new google.maps.StreetViewPanorama(this.panoNode, this.panoOptions);
                this.panoramaService = new google.maps.StreetViewService();
            }
            this.panoramaService.getPanoramaByLocation(place, 50, lang.hitch(this, 'getPanoramaByLocationComplete', geoPoint));
            // Panorama Events -- Changed location
            google.maps.event.addListener(this.panorama, 'position_changed', lang.hitch(this, 'setPlaceMarkerPosition'));
            // Panorama Events -- Changed Rotation
            google.maps.event.addListener(this.panorama, 'pov_changed', lang.hitch(this, 'setPlaceMarkerRotation'));
        },
        getPanoramaByLocationComplete: function (geoPoint, StreetViewPanoramaData, StreetViewStatus) {
            if (StreetViewStatus === 'OK') {
                this.disableStreetViewClick();
                var place = new google.maps.LatLng(geoPoint.y, geoPoint.x);
                this.setPanoPlace = place;
                this.firstSet = true;
                this.panorama.setPosition(place);
            } else if (StreetViewStatus === 'ZERO_RESULTS') {
                this.setPanoPlace = null;
                this.clearGraphics();
                // reset default map click mode
                this.connectMapClick();
                domStyle.set(this.noStreetViewResults, 'display', 'block');
            } else {
                this.setPanoPlace = null;
                this.clearGraphics();
                topic.publish('viewer/handleError', {
                    source: 'StreetView',
                    error: 'Unknown.'
                });
            }
        },
        resize: function (options) {
            if (options && options.h) {
                domGeom.setContentSize(this.containerNode, {
                    h: (options.h - 2)
                });
            }
            if (this.panorama) {
                google.maps.event.trigger(this.panorama, 'resize');
            }
        },
        setPlaceMarkerPosition: function () {
            if (!this.placeMarker || this.pointGraphics.graphics.length === 0) {
                this.placeMarker = new Graphic();
                // Add graphic to the map
                this.pointGraphics.add(this.placeMarker);
            }
            // get the new lat/long from streetview
            var panoPosition = this.panorama.getPosition();
            var positionLat = panoPosition.lat();
            var positionLong = panoPosition.lng();
            // Make sure they are numbers
            if (!isNaN(positionLat) && !isNaN(positionLong)) {
                // convert the resulting lat/long to the map's spatial reference
                var xy = null,
                    wkid = this.view.spatialReference.wkid;
                if (wkid === 102100) {
                    wkid = 3857;
                }
                var key = this.proj4Catalog + ':' + String(wkid);
                if (!proj4.defs[key]) {
                    var url = this.proj4CustomURL || this.proj4BaseURL + String(wkid) + '.js';
                    require([url], lang.hitch(this, 'setPlaceMarkerPosition'));
                    return;
                }
                // only need the one projection as we are
                // converting from WGS84 lat/long
                xy = proj4(proj4.defs[key]).forward([positionLong, positionLat]);
                if (xy) {
                    var point = new Point(xy, new SpatialReference({
                        wkid: wkid
                    }));

                    // change point position on the map
                    this.placeMarker.geometry = point;
                    if (this.setPanoPlace && !this.firstSet) {
                        var heading = google.maps.geometry.spherical.computeHeading(panoPosition, this.setPanoPlace);
                        this.panorama.setPov({
                            heading: heading,
                            pitch: 0
                        });
                        setTimeout(lang.hitch(this, function () {
                            this.setPanoPlace = null;
                        }), 1000);
                    } else {
                        this.firstSet = false;
                    }
                }
            }
        },
        setPlaceMarkerRotation: function () {
            if (this.placeMarker) {
                var pov = this.panorama.getPov();
                var newHeading = pov.heading - this.originalAngle;
                newHeading = (newHeading < 0) ? (newHeading = 360 + newHeading) : newHeading;
                this.pointSymbol.angle = newHeading;
                //this.pointGraphics.refresh();
            }
        },
        streetViewFromMapRightClick: function () {
            var evt = {
                mapPoint: this.mapViewRightClickPoint
            };
            this.getStreetView(evt, true);
        },
        setMapViewClickMode: function (mode) {
            this.mapViewClickMode = mode;
        }
    });
});

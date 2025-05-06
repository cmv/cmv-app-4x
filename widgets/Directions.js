define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'esri/layers/RouteLayer',
    'esri/widgets/Directions',
    'dojo/text!./Directions/templates/Directions.html',
    'dojo/_base/lang',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/PopupMenuItem',
    'dijit/MenuSeparator',
    'esri/geometry/Point',
    'esri/geometry/SpatialReference',
    'dojo/topic',
    'dojo/i18n!./Directions/nls/resource',
    'dojo/dom-style'
], function (declare, _WidgetBase, _TemplatedMixin, RouteLayer, Directions, template, lang, Menu, MenuItem, PopupMenuItem, MenuSeparator, Point, SpatialReference, topic, i18n, domStyle) {

    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        i18n: i18n,
        postCreate: function () {
            this.inherited(arguments);

            const routeLayer = new RouteLayer({
                url: this.options.routeServiceUrl
            });

            this.view.map.addMany([routeLayer]);

            this.directions = new Directions(lang.mixin({
                view: this.view,
                layer: routeLayer//,
                //searchProperties: this.options.searchProperties
            }, this.options), this.directionsNode);

            this.directions.layer.stops.removeAll();

            //temp fix for 3.12 and 3.13 map click button.
            if (this.directions._activateButton) {
                domStyle.set(this.directions._activateButton, 'display', 'none');
            } else if (this.directions._activateButtonNode) {
                domStyle.set(this.directions._activateButtonNode, 'display', 'none');
                domStyle.set(this.directions._addDestinationNode, 'float', 'inherit');
                domStyle.set(this.directions._optionsButtonNode, {
                    'float': 'inherit',
                    marginRight: '5px'
                });
            }

            if (this.mapViewRightClickMenu) {
                this.addRightClickMenu();
            }
        },
        addRightClickMenu: function () {
            // capture map right click position
            //this.view.on('MouseDown', lang.hitch(this, function (evt) {
            //    this.mapViewRightClickPoint = evt.mapPoint;
            //}));
            this.view.on('click', lang.hitch(this, function (evt) {
                if (evt.button == 2) {
                    this.mapViewRightClickPoint = evt.mapPoint;
                }
            }));

            this.menu = new Menu();
            this.menu.addChild(new MenuItem({
                label: this.i18n.labels.directionsFromHere,
                onClick: lang.hitch(this, 'directionsFrom')
            }));
            this.menu.addChild(new MenuItem({
                label: this.i18n.labels.directionsToHere,
                onClick: lang.hitch(this, 'directionsTo')
            }));
            this.menu.addChild(new MenuSeparator());
            this.menu.addChild(new MenuItem({
                label: this.i18n.labels.addStop,
                onClick: lang.hitch(this, 'addStop')
            }));
            this.menu.addChild(new MenuSeparator());
            this.menu.addChild(new MenuItem({
                label: this.i18n.labels.useMyLocationAsStart,
                onClick: lang.hitch(this, 'getGeoLocation', 'directionsFrom')
            }));
            this.menu.addChild(new MenuItem({
                label: this.i18n.labels.useMyLocationAsEnd,
                onClick: lang.hitch(this, 'getGeoLocation', 'directionsTo')
            }));

            // add this widgets menu as a sub menu to the map right click menu
            this.mapViewRightClickMenu.addChild(new PopupMenuItem({
                label: this.i18n.labels.directions,
                popup: this.menu
            }));
        },
        clearStops: function () {
            this.directions.layer.stops.removeAll();
        },
        directionsFrom: function () {
            if (this.directions.layer.stops.length > 0) {
                this.directions.layer.stops.at(0).geometry = this.mapViewRightClickPoint;                
            } else {
                this.directions.layer.stops.add({
                    geometry: this.mapViewRightClickPoint,
                    name: 'Start'
                });
            }   
            this.doRoute();
        },
        directionsTo: function () {
            if (this.directions.layer.stops.length > 1) {
                this.directions.layer.stops.at(this.directions.layer.stops.length - 1).geometry = this.mapViewRightClickPoint;                
            } else {
                this.directions.layer.stops.add({
                    geometry: this.mapViewRightClickPoint,
                    name: 'End'
                });             
            }   
            this.doRoute();
        },
        addStop: function () {
            //this.directions.addStop(this.mapViewRightClickPoint, this.directions.stops.length - 1).then(lang.hitch(this, 'doRoute'));
            this.directions.layer.stops.add(this.mapViewRightClickPoint);
            this.doRoute();

        },
        doRoute: function () {
            if (this.parentWidget && !this.parentWidget.open) {
                this.parentWidget.toggle();
            }
            if (this.directions.layer.stops.length >= 2) {
                this.directions.getDirections();
            }
        },
        startAtMyLocation: function () {
            this.getGeoLocation('directionsFrom');
        },
        endAtMyLocation: function () {
            this.getGeoLocation('directionsTo');
        },
        getGeoLocation: function (leg) {
            if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(lang.hitch(this, 'locationSuccess', leg), lang.hitch(this, 'locationError'));
            } else {
                topic.publish('growler/growl', {
                    title: this.i18n.errors.geoLocation.title,
                    message: this.i18n.errors.geoLocation.message,
                    level: 'default',
                    timeout: 10000,
                    opacity: 1.0
                });
            }
        },
        locationSuccess: function (leg, event) {
            this.mapViewRightClickPoint = new Point(event.coords.longitude, event.coords.latitude, new SpatialReference({
                wkid: 4326
            }));
            this[leg]();
        },
        locationError: function (error) {
            topic.publish('growler/growl', {
                title: this.i18n.errors.location.title,
                message: this.i18n.errors.location.message + error.message,
                level: 'default',
                timeout: 10000,
                opacity: 1.0
            });
        }
    });
});

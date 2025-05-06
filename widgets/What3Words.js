define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/topic',
    'dojo/on',
    'dojo/keys',

    'esri/Graphic',
    'esri/layers/GraphicsLayer',
    'esri/renderers/SimpleRenderer',
    'esri/symbols/PictureMarkerSymbol',
    'gis/esri/graphicsUtils',
    'esri/request',
    'esri/geometry/Point',
    'esri/geometry/SpatialReference',

    'dijit/registry',
    'dijit/MenuItem',

    // template
    'dojo/text!./What3Words/templates/What3Words.html',

    //i18n
    'dojo/i18n!./What3Words/nls/resources',

    // Proj4JS
    'proj4js/proj4',

    // Proj4JS
    'what3words/what3words',

    //template widgets
    'dijit/form/TextBox',
    'dijit/form/Button',

    // css
    'xstyle/css!./What3Words/css/What3Words.css'

], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,

    lang,
    array,
    topic,
    on,
    keys,

    Graphic,
    GraphicsLayer,
    SimpleRenderer,
    PictureMarkerSymbol,
    graphicsUtils,
    esriRequest,
    Point,
    SpatialReference,

    registry,
    MenuItem,

    template,

    i18n,

    proj4,
    what3words

) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: template,
        i18n: i18n,
        baseClass: 'cmwWhat3WordsWidget',

        // please use your own what3words key.
        // Available here: https://developer.what3words.com/api-register
        key: '',
        url: 'https://api.what3words.com/',

        symbol: {
            url: 'widgets/What3Words/images/what3words_pin.png',
            angle: 0,
            xoffset: -10,
            yoffset: 5,
            width: 25,
            height: 30
        },

        growlID: 'w3w-search',

        // Spatial Reference. uses the map's spatial reference if none provided
        spatialReference: null,

        // Use 0.001 for decimal degrees (wkid 4326)
        // or 2500 for meters/feet
        pointExtentSize: null,

        // in case this changes some day
        proj4BaseURL: 'https://epsg.io/',

        //  options are ESRI, EPSG and SR-ORG
        // See http://spatialreference.org/ for more information
        proj4Catalog: 'EPSG',

        // if desired, you can load a projection file from your server
        // instead of using one from spatialreference.org
        // i.e., http://server/projections/102642.js
        projCustomURL: null,

        postCreate: function () {
            this.inherited(arguments);

            if (!this.spatialReference) {
                this.spatialReference = this.view.spatialReference.wkid;
            }
            if (!this.pointExtentSize) {
                if (this.spatialReference === 4326) { // special case for geographic lat/lng
                    this.pointExtentSize = 0.001;
                } else {
                    this.pointExtentSize = 2500; // could be feet or meters
                }
            }

            this.own(on(this.w3wStringDijit, 'keyup', lang.hitch(this, 'executeStringSearchWithReturn')));
            this.own(on(this.w3wPositionDijit, 'keyup', lang.hitch(this, 'executePositionSearchWithReturn')));

            if (!window.proj4) {
                window.proj4 = proj4;
            }

            var wkid = this.view.spatialReference.wkid;
            if (wkid === 102100) { // ESRI --> EPSG
                wkid = 3857;
            }
            var key = this.proj4Catalog + ':' + String(wkid);
            if (!proj4.defs[key]) {
                var url = this.proj4BaseURL + String(wkid) + '.js';
                require([url]);
            }
            this.createGraphicLayers();

            if (this.mapViewRightClickMenu) {
                this.addRightClickMenu();
            }
        },

        createGraphicLayers: function () {
            this.resultsGraphics = new GraphicsLayer({
                id: this.id + '_Results',
                title: this.id + ' Results'
            });

            //var resultsSymbol = new PictureMarkerSymbol(this.symbol);
            //var resultsRenderer = new SimpleRenderer(resultsSymbol);
            //resultsRenderer.label = 'W3W Results';
            //resultsRenderer.description = 'W3W Results';
            //this.resultsGraphics.renderer = resultsRenderer;

            this.view.map.add(this.resultsGraphics);

            //this.resultsGraphics.setRenderer(resultsRenderer);
            //this.resultsGraphics.graphics.add(resultsRenderer);
            //this.view.map.add(this.resultsGraphics);
        },

        addRightClickMenu: function () {
            this.view.on('mousedown', lang.hitch(this, function (evt) {
                this.mapViewRightClickPoint = evt.mapPoint;
            }));
            this.mapViewRightClickMenu.addChild(new MenuItem({
                label: this.i18n.rightClickMenuItem.label,
                onClick: lang.hitch(this, 'w3wFromMapRightClick')
            }));
        },

        executeStringSearchWithReturn: function (evt) {
            this.w3wPositionDijit.set('value', '');
            if (evt.keyCode === keys.ENTER) {
                this.executeStringSearch();
            }
        },

        executeStringSearch: function () {
            var value = this.w3wStringDijit.get('value');
            if (this.checkWords(value)) {
                this.executeW3WSearch(value);
            }
        },

        executePositionSearchWithReturn: function (evt) {
            this.w3wStringDijit.set('value', '');
            if (evt.keyCode === keys.ENTER) {
                this.executePositionSearch();
            }
        },

        executePositionSearch: function (position) {
            if (!position) {
                var value = this.w3wPositionDijit.get('value');
                position = value.split(' ');
            }
            if (this.checkPosition(position)) {
                this.executeW3WSearch(position);
            }
        },

        executeW3WSearch: function (value) {
            var url = this.url, content = {};
            if (lang.isString(value)) {
                url += 'v3/convert-to-coordinates?words=';
                url += value;
                url += '&key=';
                url += this.key;
            } else {
                return;
            }            

            this.resultsGraphics.graphics.removeAll();
            this.showGrowl({
                message: i18n.searching,
                timeout: 30000, // long time out to wait for api response
                showProgressBar: true
            });
            //https://api.what3words.com/v3/convert-to-coordinates?words=bravoure.renvoyer.d%C3%A9nouer&key=Z08KDSE9

            var handle = esriRequest(url);
            handle.then(
                lang.hitch(this, 'w3wResult'),
                lang.hitch(this, 'w3wFailure')
            );
        },

        w3wResult: function (results) {
            if (!results) {
                this.w3wFailure();
                return;
            }
            if (results.data.coordinates) {
                var wkid = this.view.spatialReference.wkid;
                if (wkid === 102100) { // ESRI --> EPSG
                    wkid = 3857;
                }
                var key = this.proj4Catalog + ':' + String(wkid);
                var xy = proj4(proj4.defs[key]).forward([results.data.coordinates.lng, results.data.coordinates.lat]);
                if (xy) {
                    var point = new Point(xy, new SpatialReference({
                        wkid: wkid
                    }));

                    var resultsSymbol = new PictureMarkerSymbol(this.symbol);
                    var graphic = new Graphic({
                        geometry: point,
                        symbol: resultsSymbol
                    });

                    this.resultsGraphics.add(graphic);

                    var extent = this.getGraphicsExtent(this.resultsGraphics);
                    if (extent) {
                        this.zoomToExtent(extent);
                    }
                }
                this.w3wPositionDijit.set('value', results.data.coordinates.lat + ' ' + results.data.coordinates.lng);
                this.clearButtonDijit.set('disabled', false);
            }
            if (results.words && results.words.length === 3) {
                this.w3wStringDijit.set('value', results.words.join('.'));
            }
            this.showGrowl({
                message: i18n.success,
                level: 'success'
            });

        },

        w3wFailure: function () {
            this.showGrowl({
                message: i18n.failure,
                level: 'error'
            });

        },

        w3wFromMapRightClick: function () {
            this.clearResults();

            var wkid = this.map.spatialReference.wkid;
            if (wkid === 102100) { // ESRI --> EPSG
                wkid = 3857;
            }
            var key = this.proj4Catalog + ':' + String(wkid);
            // only need one projection as we are
            // converting to WGS84 lat/long
            var point = proj4(proj4.defs[key]).inverse([this.mapViewRightClickPoint.x, this.mapViewRightClickPoint.y]);
            if (point) {
                this.w3wPositionDijit.set('value', point.join(' '));
                this.executePositionSearch();
            }
        },

        zoomToExtent: function (extent) {
            this.view.extent = extent.expand(1.5);
        },

        getGraphicsExtent: function (layer) {
            var zoomExtent = null;
            if (layer.graphics && layer.graphics.length) {
                zoomExtent = graphicsUtils.graphicsExtent(layer.graphics);
                if (zoomExtent.xmin === zoomExtent.xmax || zoomExtent.ymin === zoomExtent.ymax) {
                    zoomExtent = this.expandExtent(zoomExtent);
                }
            }
            return zoomExtent;
            /*
            var extent = null;
            if (graphics) {
                extent = graphicsUtils.graphicsExtent(graphics);
                if (extent.xmin === extent.xmax || extent.ymin === extent.ymax) {
                    extent = this.expandExtent(extent);
                }
            }
            return extent;*/
        },

        expandExtent: function (extent) {
            extent.xmin -= this.pointExtentSize;
            extent.ymin -= this.pointExtentSize;
            extent.xmax += this.pointExtentSize;
            extent.ymax += this.pointExtentSize;
            return extent;
        },

        checkWords: function (value) {
            var ret = false;
            var a = value.split('.');
            if (a.length === 3) {
                ret = true;
            }
            if (!ret) {
                a = value.split(',');
                if (a.length === 3) {
                    ret = true;
                }
            }
            if (!ret) {
                a = value.split(' ');
                if (a.length === 3) {
                    ret = true;
                }
            }

            if (value.length < 14 || value.length > 38) {
                this.showGrowl({
                    message: i18n.invalidLength,
                    level: 'error'
                });
                return false;
            }

            var retWord = true;
            array.forEach(a, function (word) {
                if (word.length < 3 || word.length > 12) {
                    this.showGrowl({
                        message: '"' + word + '"' + i18n.invalidWordLength,
                        level: 'error'
                    });
                    retWord = false;
                }
            });
            if (!retWord) {
                return false;
            }

            if (!ret) {
                this.showGrowl({
                    message: i18n.not3Words,
                    level: 'error'
                });
            }
            return ret;
        },

        checkPosition: function (position) {
            if (lang.isArray(position) && position.length === 2) {
                return true;
            }
            this.showGrowl({
                message: i18n.notPosition,
                level: 'error'
            });
            return false;
        },

        showGrowl: function (opts) {
            this.clearGrowl();
            if (opts) {
                opts = lang.mixin({
                    title: i18n.growlTitle,
                    id: this.growlID,
                    level: 'info',
                    timeout: 5000
                }, opts);
                topic.publish('growler/growl', opts);
            }
        },

        clearGrowl: function () {
            var growl = registry.byId(this.growlID);
            if (growl && growl.close) {
                growl.close();
                registry.remove(this.growlID);
            }
        },

        clearResults: function () {
            this.resultsGraphics.graphics.removeAll();
            this.w3wStringDijit.set('value', '');
            this.w3wPositionDijit.set('value', '');
            this.clearButtonDijit.set('disabled', true);
        }

    });
});

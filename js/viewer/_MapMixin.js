define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom',
    'dojo/_base/array',
    'dojo/Deferred',

    'dojo/sniff',

    'esri/Map',
    'esri/views/MapView',
    'esri/Basemap',
    'esri/layers/TileLayer',
    'esri/layers/support/TileInfo',

    'esri/identity/IdentityManager'

], function (
    declare,
    lang,
    on,
    dom,
    array,
    Deferred,

    has,

    Map,
    MapView,
    Basemap,
    TileLayer,
    TileInfo

) {

    return declare(null, {

        postConfig: function () {
            this.mapViewDeferred = new Deferred();
            return this.inherited(arguments);
        },

        startup: function () {
            // ignore visibility of group layers in dynamic layers?
            this.ignoreDynamicGroupVisibility = (this.config.ignoreDynamicGroupVisibility === false) ? false : true;
            this.inherited(arguments);
            this.layoutDeferred.then(lang.hitch(this, 'initMapViewAsync'));
        },

        initMapViewAsync: function () {
            var returnDeferred = new Deferred();
            var returnWarnings = [];

            this.createMapView(returnWarnings).then(
                lang.hitch(this, '_createMapViewResult', returnDeferred, returnWarnings)
            );

            returnDeferred.then(lang.hitch(this, 'initMapViewComplete'));

            return returnDeferred;
        },

        createMapView: function (returnWarnings) {
            // mixins override the default createMap method and return a deferred
            var result = this.inherited(arguments);
            if (result) {
                return result;
            }

            // otherwise we can create the map
            var mapViewDeferred = new Deferred(),
                container = dom.byId(this.config.layout.mapView) || 'mapViewCenter';

            var basemap = new Basemap({
                baseLayers: [
                    new TileLayer({
                       url: this.config.mapOptions.basemap,
                       title: this.config.mapOptions.title,
                       opacity: this.config.mapOptions.opacity
                    })
                ],
                title: "Fond de base",
                id: "FondDeBase"
            });           

            // Create the Map Instance to manage layers
            const mapManager = new Map({
                basemap: basemap
            });

            // Create the MapView Instance to display a 2D view
            this.mapView = new MapView({
                container: container,
                map: mapManager,
                spatialReference: this.config.mapOptions.spatialReference,
                //spatialReferenceLocked: this.config.mapOptions.spatialReferenceLocked,
                constraints: {
                    rotationEnabled: false/*,
                    lods: TileInfo.create({
                         spatialReference: {
                         wkid: this.config.mapOptions.spatialReference
                       }
                    }).lods*/
                }
            });     

            if (has('phone')) {
                this.mapView.ui.padding = { left: 50 };
            } 

            this.mapView.ui.remove("attribution");    

            // let some other mixins modify or add map items async
            var wait = this.inherited(arguments);
            if (wait) {
                wait.then(function (warnings) {
                    if (warnings) {
                        returnWarnings = returnWarnings.concat(warnings);
                    }
                    mapViewDeferred.resolve(returnWarnings);
                });
            } else {
                mapViewDeferred.resolve(returnWarnings);
            }
            return mapViewDeferred;
        },

        _createMapViewResult: function (returnDeferred, returnWarnings) {
            if (this.mapView) {
                //if (!this.config.webMapId && this.config.mapOptions && this.config.mapOptions.basemap) {
                //    this.map.on('load', lang.hitch(this, '_initLayers', returnWarnings));
                //} else {
                this._initLayers(returnWarnings);
                //}

                if (this.config.operationalLayers && this.config.operationalLayers.length > 0) {
                    on.once(this.mapView, 'layerview-create', lang.hitch(this, '_onLayersAddResult', returnDeferred, returnWarnings));
                } else {
                    returnDeferred.resolve(returnWarnings);
                }
            } else {
                returnDeferred.resolve(returnWarnings);
            }
            return returnDeferred;
        },

        _onLayersAddResult: function (returnDeferred, returnWarnings, lyrsResult) {
            array.forEach(lyrsResult.layers, function (addedLayer) {
                if (addedLayer.success !== true) {
                    returnWarnings.push(addedLayer.error);
                }
            }, this);
            returnDeferred.resolve(returnWarnings);
        },

        _initLayers: function (returnWarnings) {
            this.layers = [];
            var layerTypes = {
                csv: 'esri/layers/CSVLayer',
                //dataadapter: 'esri/layers/DataAdapterFeatureLayer', //untested
                dynamic: 'esri/layers/MapImageLayer',
                feature: 'esri/layers/FeatureLayer',
                georss: 'esri/layers/FeatureLayer',
                graphics: 'esri/layers/GraphicsLayer',
                image: 'esri/layers/ImageryLayer',
                imagevector: 'esri/layers/ImageryLayer',
                kml: 'esri/layers/KMLLayer',
                mapimage: 'esri/layers/MapImageLayer', //untested
                osm: 'esri/layers/OpenStreetMapLayer',
                raster: 'esri/layers/ImageryLayer',
                stream: 'esri/layers/StreamLayer',
                tiled: 'esri/layers/TileLayer',
                vectortile: 'esri/layers/VectorTileLayer',
                webtiled: 'esri/layers/WebTileLayer',
                wfs: 'esri/layers/WFSLayer',
                wms: 'esri/layers/WMSLayer',
                wmts: 'esri/layers/WMTSLayer' //untested
            };
            // add any user-defined layer types such as https://github.com/Esri/geojson-layer-js
            layerTypes = lang.mixin(layerTypes, this.config.layerTypes || {});
            // loading all the required modules first ensures the layer order is maintained
            var modules = [];
            array.forEach(this.config.operationalLayers, function (layer) {
                var type = layerTypes[layer.type];
                if (type) {
                    modules.push(type);
                } else {
                    returnWarnings.push('Layer type "' + layer.type + '" is not supported: ');
                }
            }, this);

            require(modules, lang.hitch(this, function () {
                array.forEach(this.config.operationalLayers, function (layer) {
                    var type = layerTypes[layer.type];
                    if (type) {
                        require([type], lang.hitch(this, '_initLayer', layer));
                    }
                }, this);
                //this.map.addLayers(this.layers);

                array.forEach(this.layers, function (layer) {
                    this.mapView.map.add(layer);  
                }, this);
            }));
        },

        _initLayer: function (layer, Layer) {
            var l = null;
            try {
                //if (layer.url) {
                //    l = new Layer(layer.url, layer.options);
                //} else {
                l = new Layer(layer.options);
                //}
                this.layers.unshift(l); //unshift instead of push to keep layer ordering on map intact
            } catch (e) {
                this.handleError({
                    source: '_MapViewMixin._initLayer',
                    error: e
                });
            }

            //Legend LayerInfos array
            var excludeLayerFromLegend = false;
            if (typeof layer.legendLayerInfos !== 'undefined' && typeof layer.legendLayerInfos.exclude !== 'undefined') {
                excludeLayerFromLegend = layer.legendLayerInfos.exclude;
            }
            if (!excludeLayerFromLegend) {
                var configuredLayerInfo = {};
                if (typeof layer.legendLayerInfos !== 'undefined' && typeof layer.legendLayerInfos.layerInfo !== 'undefined') {
                    configuredLayerInfo = layer.legendLayerInfos.layerInfo;
                }
                var layerInfo = lang.mixin({
                    layer: l,
                    title: layer.title || null
                }, configuredLayerInfo);

                this.legendLayerInfos.unshift(layerInfo); //unshift instead of push to keep layer ordering in legend intact
            }

            //LayerControl LayerInfos array
            var layerControlOptions = lang.mixin({
                ignoreDynamicGroupVisibility: this.ignoreDynamicGroupVisibility
            }, layer.layerControlLayerInfos);

            //unshift instead of push to keep layer ordering in LayerControl intact
            this.layerControlLayerInfos.unshift({
                layer: l,
                type: layer.type,
                title: layer.title,
                controlOptions: layerControlOptions
            });

            if (layer.type === 'feature') {
                var options = {
                    featureLayer: l
                };
                if (layer.editorLayerInfos) {
                    lang.mixin(options, layer.editorLayerInfos);
                }
                if (options.exclude !== true) {
                    this.editorLayerInfos.push(options);
                }
            }

            if (layer.type === 'dynamic' && this.ignoreDynamicGroupVisibility) {
                on(l, 'load', lang.hitch(this, 'removeGroupLayers'));
            }

            if (layer.type === 'dynamic' || layer.type === 'feature') {
                var idOptions = {
                    layer: l,
                    title: layer.title,
                    ignoreDynamicGroupVisibility: this.ignoreDynamicGroupVisibility
                };
                if (layer.identifyLayerInfos) {
                    lang.mixin(idOptions, layer.identifyLayerInfos);
                }
                if (idOptions.exclude !== true) {
                    this.identifyLayerInfos.push(idOptions);
                }
            }
        },

        removeGroupLayers: function (res) {
            var visibleLayers = [], groupRemoved = false, layer = res.layer,
                originalVisibleLayers = layer.visibleLayers || layer._defaultVisibleLayers;
            array.forEach(originalVisibleLayers, function (subLayerId) {
                var subLayerInfo = array.filter(layer.layerInfos, function (sli) {
                    return sli.id === subLayerId;
                })[0];
                if (subLayerInfo && subLayerInfo.subLayerIds === null) {
                    visibleLayers.push(subLayerId);
                } else {
                    groupRemoved = true;
                }
            });

            if (visibleLayers.length > 0 && groupRemoved) {
                layer.setVisibleLayers(visibleLayers);
            }
        },

        initMapViewComplete: function (warnings) {
            if (warnings && warnings.length > 0) {
                this.handleError({
                    source: 'Controller',
                    error: warnings.join(', ')
                });
            }

            if (this.mapView) {

                this.mapView.on('resize', function (evt) {
                    //var pnt = evt.target.extent.getCenter();
                    //setTimeout(function () {
                    //    evt.target.centerAt(pnt);
                    //}, 100);
                });

                // resolve the map deferred
                this.mapViewDeferred.resolve(this.mapView);
            }

        },

        initMapViewError: function (err) {
            this.handleError({
                source: 'Controller',
                error: err
            });
        },

        resizeMapView: function () {
            if (this.mapView) {
                this.mapView.resize();
            }
        },

        getMapViewHeight: function () {
            if (this.mapView) {
                return this.mapView.height;
            }
            return 0;

        }
    });
});

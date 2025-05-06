define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/_base/array',
    'dojo/sniff',

    'esri/PopupTemplate',
    'esri/layers/GraphicsLayer',
    'esri/Graphic',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'gis/esri/graphicsUtils'

], function (
    declare,
    lang,
    topic,
    array,
    has,

    PopupTemplate,
    GraphicsLayer,
    Graphic,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    graphicsUtils
) {

    return declare(null, {

        //graphic layers
        featureGraphics: null,
        selectedGraphics: null,
        bufferGraphics: null,
        sourceGraphics: null,

        spatialReference: null,
        pointExtentSize: null,

        addToLayerControl: true,

        symbolOptions: {},

        // Default symbology for features
        defaultSymbolOptions: {
            features: {
                point: {
                    //type: 'esriSMS',
                    style: 'circle',
                    size: 15,
                    //color: [200, 0, 200, 16],
                    angle: 0,
                    xoffset: 0,
                    yoffset: 0,
                    outline: {
                        type: 'simple-line',
                        style: 'solid',
                        color: [200, 0, 200, 200],
                        width: 2
                    }
                },
                polyline: {
                    //type: 'esriSLS',
                    style: 'solid',
                    color: [200, 0, 200, 192],
                    width: 2
                },
                polygon: {
                    //type: 'esriSFS',
                    style: 'solid',
                    color: [255, 0, 255, 16],
                    outline: {
                        type: 'simple-line',
                        style: 'solid',
                        color: [200, 0, 200, 192],
                        width: 1
                    }
                }
            },

            // Default symbology for selected features
            selected: {
                point: {
                    //type: 'esriSMS',
                    style: 'circle',
                    size: 15,
                    //color: [0, 255, 255, 16],
                    angle: 0,
                    xoffset: 0,
                    yoffset: 0,
                    outline: {
                        type: 'simple-line',
                        style: 'solid',
                        color: [0, 255, 255, 255],
                        width: 2
                    }
                },
                polyline: {
                   // type: 'esriSLS',
                    style: 'solid',
                    color: [0, 255, 255, 255],
                    width: 2
                },
                polygon: {
                    //type: 'esriSFS',
                    style: 'solid',
                    color: [0, 255, 255, 32],
                    outline: {
                        type: 'simple-line',
                        style: 'solid',
                        color: [0, 255, 255, 255],
                        width: 2
                    }
                }
            },

            // Default symbology for highlighted features
            highlighted: {
                point: {
                    //type: 'esriSMS',
                    style: 'circle',
                    size: 15,
                    color: [255, 255, 255, 64],
                    angle: 0,
                    xoffset: 0,
                    yoffset: 0,
                    outline: {
                        type: 'simple-line',
                        style: 'solid',
                        color: [0, 255, 255, 255],
                        width: 2
                    }
                },
                polyline: {
                    //type: 'esriSLS',
                    style: 'solid',
                    color: [0, 255, 255, 255],
                    width: 2
                },
                polygon: {
                    //type: 'esriSFS',
                    style: 'solid',
                    color: [0, 255, 255, 64],
                    outline: {
                        type: 'simple-line',
                        style: 'solid',
                        color: [0, 255, 255, 255],
                        width: 2
                    }
                }
            },

            // Default symbology for source features
            source: {
                point: {
                    //type: 'esriSMS',
                    style: 'circle',
                    size: 3,
                    color: [0, 0, 0, 32],
                    angle: 0,
                    xoffset: 0,
                    yoffset: 0,
                    outline: {
                        type: 'simple-line',
                        style: 'solid',
                        color: [0, 0, 0, 128],
                        width: 1
                    }
                },
                polyline: {
                    //type: 'esriSLS',
                    style: 'solid',
                    color: [0, 0, 0, 128],
                    width: 1
                },
                polygon: {
                    //type: 'esriSFS',
                    style: 'solid',
                    color: [0, 0, 0, 0.1],
                    outline: {
                        type: 'simple-line',
                        style: 'solid',
                        color: [0, 0, 0, 128],
                        width: 1
                    }
                }
            },

            // Default symbology for buffer
            buffer: {
               // type: 'esriSFS',
                style: 'solid',
                color: [255, 0, 0, 32],
                outline: {
                    type: 'simple-line',
                    style: 'dash',
                    color: [255, 0, 0, 255],
                    width: 1
                }
            }
        },

        infoTemplates: {
            // infoTemplate when feature graphics are clicked
            features: null,

            // infoTemplate when selected feature graphics are clicked
            selected: null,

            // infoTemplate when source graphics are clicked
            source: null,

            // infoTemplate when buffer graphics are clicked
            buffer: null
        },

        getGraphicsConfiguration: function (options) {
            this.symbolOptions = this.mixinDeep(lang.clone(this.defaultSymbolOptions), options);

            // symbology for features returned from query
            var symbol = lang.mixin({}, this.symbolOptions.features);
            this.featurePointSymbol = new SimpleMarkerSymbol(symbol.point);
            this.featurePolylineSymbol = new SimpleLineSymbol(symbol.polyline);
            this.featurePolygonSymbol = new SimpleFillSymbol(symbol.polygon);

            // symbology for the source feature
            symbol = lang.mixin({}, this.symbolOptions.source);
            this.sourcePointSymbol = new SimpleMarkerSymbol(symbol.point);
            this.sourcePolylineSymbol = new SimpleLineSymbol(symbol.polyline);
            this.sourcePolygonSymbol = new SimpleFillSymbol(symbol.polygon);

            // symbology for features selected
            symbol = lang.mixin({}, this.symbolOptions.selected);
            this.selectedPointSymbol = new SimpleMarkerSymbol(symbol.point);
            this.selectedPolylineSymbol = new SimpleLineSymbol(symbol.polyline);
            this.selectedPolygonSymbol = new SimpleFillSymbol(symbol.polygon);

            // symbology for features highlighted (mouseover)
            symbol = lang.mixin({}, this.symbolOptions.highlighted);
            this.highlightedPointSymbol = new SimpleMarkerSymbol(symbol.point);
            this.highlightedPolylineSymbol = new SimpleLineSymbol(symbol.polyline);
            this.highlightedPolygonSymbol = new SimpleFillSymbol(symbol.polygon);

            // symbology for source feature buffer
            symbol = lang.mixin({}, this.symbolOptions.buffer);
            this.bufferPolygonSymbol = new SimpleFillSymbol(symbol);

        },

        /*******************************
        *  Add Graphics Layer
        *******************************/

        addGraphicsLayer: function () {
            this.sourceGraphics = new GraphicsLayer({
                id: this.topicID + '_SourceGraphics',
                title: 'Attribute Source Graphics',
                spatialReference: this.view.spatialReference
            });
            if (this.infoTemplates.source) {
                this.sourceGraphics.setInfoTemplate(new PopupTemplate(this.infoTemplates.source));
            }
            this.view.map.add(this.sourceGraphics);

            this.bufferGraphics = new GraphicsLayer({
                id: this.topicID + '_BufferGraphics',
                title: 'Attribute Buffer Graphics',
                spatialReference: this.view.spatialReference
            });
            if (this.infoTemplates.buffer) {
                this.bufferGraphics.setInfoTemplate(new PopupTemplate(this.infoTemplates.buffer));
            }
            this.view.map.add(this.bufferGraphics);

            this.featureGraphics = new GraphicsLayer({
                id: this.topicID + '_FeatureGraphics',
                title: 'Attribute Feature Graphics',
                spatialReference: this.view.spatialReference
            });
            if (this.infoTemplates.features) {
                this.featureGraphics.setInfoTemplate(new PopupTemplate(this.infoTemplates.features));
            }
            if (this.featureOptions && this.featureOptions.selected !== false) {
                this.featureGraphics.on('click', lang.hitch(this, 'selectFeatureFromMap'));

                /** HACK **
                    The 'mouse-out' event for a GraphicsLayer is not triggered for Microsoft IE or Microsoft Edge. This appears to be due to a bug with the ESRI JavaScript API. As a result, we can't highlight a feature when the mouse is over that feature in those browser.
                */
                if (!has('ie') && !has('trident') && !((/Edge\/12./i).test(navigator.userAgent))) {
                    this.featureGraphics.on('mouse-over', lang.hitch(this, function (evt) {
                        this.highlightGraphic(evt, false);
                    }));
                    this.featureGraphics.on('mouse-out', lang.hitch(this, function (evt) {
                        this.highlightGraphic(evt, true);
                    }));
                }
            }
            this.view.map.add(this.featureGraphics);

            this.selectedGraphics = new GraphicsLayer({
                id: this.topicID + '_SelectedGraphics',
                title: 'Attribute Selected Graphics'
            });
            if (this.infoTemplates.selected) {
                this.selectedGraphics.setInfoTemplate(new PopupTemplate(this.infoTemplates.selected));
            }
            this.selectedGraphics.on('click', lang.hitch(this, 'selectFeatureFromMap'));

            this.view.map.add(this.selectedGraphics);

            if (this.addToLayerControl) {
                this.addLayerToLayerControl();
            }

        },

        /*******************************
        *  Adding Graphics Functions
        *******************************/

        addFeatureGraphic: function (feature) {
            var symbol = null,
                graphic = null;
            switch (feature.geometry.type) {
            case 'point':
            case 'multipoint':
                symbol = this.featurePointSymbol;
                break;
            case 'polyline':
                symbol = this.featurePolylineSymbol;
                break;
            case 'polygon':
                symbol = this.featurePolygonSymbol;
                break;
            default:
            }
            if (symbol) {
                graphic = new Graphic(feature.geometry, symbol, feature.attributes);
                if (this.infoTemplate) {
                    graphic.setInfoTemplate(this.infoTemplate);
                }
                this.featureGraphics.add(graphic);
            }
        },

        addSourceGraphic: function (geometry) {
            var symbol = null,
                graphic = null;
            switch (geometry.type) {
            case 'point':
            case 'multipoint':
                symbol = this.sourcePointSymbol;
                break;
            case 'polyline':
                symbol = this.sourcePolylineSymbol;
                break;
            case 'extent':
            case 'polygon':
                symbol = this.sourcePolygonSymbol;
                break;
            default:
            }
            if (symbol) {
                graphic = new Graphic(geometry, symbol);
                this.sourceGraphics.add(graphic);
            }
        },

        addSelectedGraphic: function (feature) {
            var graphic = null,
                symbol = null;
            if (!this.featureOptions.selected) {
                return;
            }
            this.selectedFeatures.push(feature);

            switch (feature.feature.geometry.type) {
            case 'point':
            case 'multipoint':
                symbol = this.selectedPointSymbol;
                break;
            case 'polyline':
                symbol = this.selectedPolylineSymbol;
                break;
            case 'polygon':
                symbol = this.selectedPolygonSymbol;
                break;
            default:
            }
            if (symbol) {
                graphic = new Graphic(feature.feature.geometry, symbol, feature.attributes);
                if (this.infoTemplate) {
                    graphic.setInfoTemplate(this.infoTemplate);
                }
                this.selectedGraphics.add(graphic);
            }
        },

        addBufferGraphic: function (geometry) {
            var symbol = this.bufferPolygonSymbol;
            var graphic = new Graphic(geometry, symbol);
            this.bufferGraphics.add(graphic);
        },

        /*******************************
        *  Selection Functions
        *******************************/

        selectFeatureFromMap: function (evt) {
            var key = null,
                graphic = evt.graphic,
                row = null,
                center = null,
                extent = null;

            if (!this.featureOptions.selected) {
                return;
            }

            if (graphic) {
                key = graphic.attributes[this.idProperty];
                if (key) {
                    row = this.grid.row(key);
                    if (row) {
                        // prevents the map from moving around
                        // by zooming to selected features
                        var mnu = this.toolbarOptions.zoom;
                        var zm = mnu.selected;
                        mnu.selected = false;

                        this.selectFeaturesWithKey(key);
                        this.doneSelectingFeatures(false);

                        // reset the original zooming
                        mnu.selected = zm;
                        this.setToolbarButtons();
                    }
                }
                if (!evt.ctrlKey && !evt.shiftKey && this.selectedFeatures.length === 1) {
                    if (graphic.infoTemplate && this.map.infoWindow) {
                        extent = this.getGraphicsExtent(this.selectedGraphics);
                        if (extent) {
                            center = extent.getCenter();
                        }
                        if (center) {
                            this.view.popup.features = [graphic];
                            //this.map.infoWindow.setTitle(item.title);
                            //this.map.infoWindow.setContent(item.content);
                            if (this.view.popup.reposition) {
                                this.view.popup.reposition();
                            }
                            this.view.popup.show(center);
                        }
                    }
                }
            }
        },

        selectFeaturesWithKey: function (key) {
            var selection = lang.clone(this.grid.get('selection')),
                row = null,
                feature = null;
            selection[key] = (selection[key] !== true);

            this.selectedFeatures = [];
            this.selectedGraphics.clear();
            //this.grid.clearSelection();

            for (var sKey in selection) {
                if (selection.hasOwnProperty(sKey)) {
                    if (this.grid.select) {
                        row = this.grid.row(sKey);
                        this.grid.select(row, null, selection[sKey]);
                    }
                    if (selection[sKey]) {
                        feature = this.getFeatureFromStore(sKey);
                        if (feature && feature.geometry) {
                            this.addSelectedGraphic(feature);
                        }
                    }
                }
            }

        },

        /*******************************
        *  Visibility Functions
        *******************************/

        showAllGraphics: function () {
            this.showFeatureGraphics();
            this.showSelectedGraphics();
            this.showSourceGraphics();
            this.showBufferGraphics();
        },

        hideAllGraphics: function () {
            this.hideFeatureGraphics();
            this.hideSelectedGraphics();
            this.hideSourceGraphics();
            this.hideBufferGraphics();
        },

        showFeatureGraphics: function () {
            this.showGraphicsLayer(this.featureGraphics);
        },

        hideFeatureGraphics: function () {
            this.hideGraphicsLayer(this.featureGraphics);
        },

        showSelectedGraphics: function () {
            this.showGraphicsLayer(this.selectedGraphics);
        },

        hideSelectedGraphics: function () {
            this.hideGraphicsLayer(this.selectedGraphics);
        },

        showSourceGraphics: function () {
            this.showGraphicsLayer(this.sourceGraphics);
        },

        hideSourceGraphics: function () {
            this.hideGraphicsLayer(this.sourceGraphics);
        },

        showBufferGraphics: function () {
            this.showGraphicsLayer(this.bufferGraphics);
        },

        hideBufferGraphics: function () {
            this.hideGraphicsLayer(this.bufferGraphics);
        },

        showGraphicsLayer: function (layer) {
            if (layer) {
                layer.visible = true;
            }
        },

        hideGraphicsLayer: function (layer) {
            if (layer) {
                layer.visible = false;
            }
        },

        highlightGraphic: function (evt, removehighlight) {
            var graphic = evt.graphic,
                symbol = null;

            // mapClickMode won't be set by default
            // so we must also look for null
            if (this.mapViewClickMode && this.mapViewClickMode !== 'identify') {
                removehighlight = true;
            }
            if (graphic) {
                switch (graphic.geometry.type) {
                case 'point':
                case 'multipoint':
                    if (removehighlight) {
                        symbol = this.featurePointSymbol;
                    } else {
                        symbol = this.highlightedPointSymbol;
                    }
                    break;
                case 'polyline':
                    if (removehighlight) {
                        symbol = this.featurePolylineSymbol;
                    } else {
                        symbol = this.highlightedPolylineSymbol;
                    }
                    break;
                case 'polygon':
                    if (removehighlight) {
                        symbol = this.featurePolygonSymbol;
                    } else {
                        symbol = this.highlightedPolygonSymbol;
                    }
                    break;
                default:
                    break;
                }
                if (symbol) {
                    graphic.setSymbol(symbol);
                }
                if (graphic.getDojoShape() !== null) {
                    graphic.getDojoShape().moveToFront();
                }
            }
            this.setToolbarButtons();
        },

        /*******************************
        *  Zoom Functions
        *******************************/

        zoomToFeatureGraphics: function () {
            var extent = null,
                featureExtent = this.getGraphicsExtent(this.featureGraphics);
            if (featureExtent) {
                if (this.sourceGraphics) {
                    extent = this.getGraphicsExtent(this.sourceGraphics);
                    if (extent) {
                        featureExtent.union(extent);
                    }
                }
                if (this.bufferGraphics) {
                    extent = this.getGraphicsExtent(this.bufferGraphics);
                    if (extent) {
                        featureExtent.union(extent);
                    }
                }
            }

            if (featureExtent) {
                this.zoomToExtent(featureExtent);
            }
        },

        zoomToSelectedGraphics: function () {
            return this.zoomToGraphics(this.selectedGraphics);
        },

        zoomToSourceGraphics: function () {
            return this.zoomToGraphics(this.sourceGraphics);
        },

        zoomToBufferGraphics: function () {
            return this.zoomToGraphics(this.bufferGraphics);
        },

        zoomToGraphics: function (layer) {
            if (layer) {
                var zoomExtent = this.getGraphicsExtent(layer);
                if (zoomExtent) {
                    this.zoomToExtent(zoomExtent);
                }
                return zoomExtent;
            }
            return null;
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

            /*var zoomExtent = null;
            if (layer.graphics && layer.graphics.length) {                
                for (var g in layer.graphics.items) {
                    var graphic = layer.graphics.items[g];
                    if (graphic.geometry != null) {
                        if (graphic.geometry.type == 'point') {
                            var ext = new Extent();
                            ext.xmin = graphic.geometry.x;
                            ext.ymin = graphic.geometry.y;
                            ext.xmax = graphic.geometry.x;
                            ext.ymax = graphic.geometry.y;

                            if (zoomExtent == null) {
                                zoomExtent = ext.clone();
                            } else {
                                zoomExtent = zoomExtent.union(ext);
                            }
                            
                        }
                        else
                        {
                            if (zoomExtent == null) {
                                zoomExtent = graphic.geometry.clone();
                            } else {
                                zoomExtent = zoomExtent.union(ext);
                            }
                        }
                    }
                }
            }
            return zoomExtent;*/
        },

        expandExtent: function (extent) {
            if (!this.spatialReference) {
                this.spatialReference = this.view.spatialReference.wkid;
            }
            if (!this.pointExtentSize) {
                if (this.spatialReference === 4326) { // special case for geographic lat/lng
                    this.pointExtentSize = 0.0001;
                } else {
                    this.pointExtentSize = 250; // could be feet or meters
                }
            }

            extent.xmin -= this.pointExtentSize;
            extent.ymin -= this.pointExtentSize;
            extent.xmax += this.pointExtentSize;
            extent.ymax += this.pointExtentSize;
            return extent;
        },

        /*******************************
        *  Clearing Functions
        *******************************/

        clearFeatureGraphics: function (specificFeatures) {
            this.clearGraphicsLayer(this.featureGraphics, specificFeatures);
            this.hideInfoWindow();
            if (this.addToLayerControl && (this.featureGraphics.graphics.length === 0)) {
                this.removeLayerFromLayerControl();
            }
        },

        showOnlySelectedFeatureGraphics: function (specificGraphics) {
            this.keepSpecificGraphics(this.featureGraphics, specificGraphics);

            this.setToolbarButtons();
            topic.publish(this.attributesContainerID + '/tableUpdated', this);
            this.zoomToFeatureGraphics();
        },

        clearSelectedGraphics: function () {
            this.clearGraphicsLayer(this.selectedGraphics);
        },

        clearSourceGraphics: function () {
            this.clearGraphicsLayer(this.sourceGraphics);
        },

        clearBufferGraphics: function () {
            this.clearGraphicsLayer(this.bufferGraphics);
        },

        clearGraphicsLayer: function (layer, specificGraphics) {
            if (layer) {
                if (specificGraphics && specificGraphics.selection && specificGraphics.idProperty) {
                    this.clearSpecificGraphics(layer, specificGraphics);
                } else {
                    layer.graphics.removeAll();
                }
            }
            this.setToolbarButtons();
            topic.publish(this.attributesContainerID + '/tableUpdated', this);

        },

        clearSpecificGraphics: function (layer, specificGraphics) {
            var selectionFilter = [];
            for (var key in specificGraphics.selection) {
                if (key) {
                    selectionFilter.push(key);
                }
            }

            // Tried to to it with dojox.json.query, no success
            var specificGraphicsFound = layer.graphics.filter(function (graphic) {
                var idProperty = graphic.attributes[specificGraphics.idProperty];
                if (idProperty) {
                    return selectionFilter.indexOf(idProperty.toString()) >= 0;
                }
                return false;
            });

            if (specificGraphicsFound.length > 0) {
                array.forEach(specificGraphicsFound, function (graphic) {
                    layer.remove(graphic);
                });
            }
        },

        keepSpecificGraphics: function (layer, specificGraphics) {
            var selectionFilter = [];
            for (var key in specificGraphics.selection) {
                if (key) {
                    selectionFilter.push(key);
                }
            }

            var specificGraphicsFound = layer.graphics.filter(function (graphic) {
                var idProperty = graphic.attributes[specificGraphics.idProperty];
                if (idProperty) {
                    return selectionFilter.indexOf(idProperty.toString()) < 0;
                }
                return false;
            });

            if (specificGraphicsFound.length > 0) {
                array.forEach(specificGraphicsFound, function (graphic) {
                    layer.remove(graphic);
                });
            }
        },

        /*******************************
         *  Remove Graphic Layers
         *******************************/

        removeGraphicLayers: function () {
            if (this.addToLayerControl) {
                this.removeLayerFromLayerControl();
            }

            this.view.map.remove(this.featureGraphics);
            this.featureGraphics = null;

            this.view.map.remove(this.selectedGraphics);
            this.selectedGraphics = null;

            this.view.map.remove(this.sourceGraphics);
            this.sourceGraphics = null;

            this.view.map.remove(this.bufferGraphics);
            this.bufferGraphics = null;
        },

        /*******************************
         *  Add/Remove layer from Layer Control widget
         *******************************/

        addLayerToLayerControl: function () {
            var layerControlInfo = {
                controlOptions: {
                    expanded: false,
                    noLegend: true,
                    metadataUrl: false,
                    swipe: false
                },
                layer: this.featureGraphics,
                title: 'Search Results - ' + this.title,
                type: 'feature'
            };
            topic.publish('layerControl/addLayerControls', [layerControlInfo]);

            this.layerControlToggleTopic = topic.subscribe('layerControl/layerToggle', lang.hitch(this, function (r) {
                if (r.id === this.featureGraphics.id) {
                    var viz = this.featureGraphics.visible;
                    this.sourceGraphics.setVisibility(viz);
                    this.bufferGraphics.setVisibility(viz);
                    this.featureGraphics.setVisibility(viz);
                    this.selectedGraphics.setVisibility(viz);
                }
            }));
        },

        removeLayerFromLayerControl: function () {
            topic.publish('layerControl/removeLayerControls', [this.featureGraphics]);
            if (this.layerControlToggleTopic) {
                this.layerControlToggleTopic.remove();
                this.layerControlToggleTopic = null;
            }
        }
    });
});

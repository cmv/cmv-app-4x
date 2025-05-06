define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/MenuItem',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/promise/all',
    'dojo/topic',
    'dojo/query',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dnd/Moveable',
    'dojo/store/Memory',

    'esri/rest/identify',
    'esri/rest/support/IdentifyParameters',
    'esri/PopupTemplate',
    'esri/layers/FeatureLayer',
    'esri/TimeExtent',

    'dojo/sniff',

    'dojo/Deferred',
    'dojo/text!./Identify/templates/Identify.html',
    'dojo/i18n!./Identify/nls/resource',
    './Identify/Formatters',

    'dijit/form/Form',
    'dijit/form/FilteringSelect',
    'xstyle/css!./Identify/css/Identify.css'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, MenuItem, lang, array, all, topic, query, domStyle, domClass, Moveable, Memory,
    identify, IdentifyParameters, PopupTemplate, FeatureLayer, TimeExtent,
    has, Deferred, IdentifyTemplate, i18n, Formatters) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: IdentifyTemplate,
        baseClass: 'gis_IdentifyDijit',
        i18n: i18n,

        mapViewClickMode: null,
        identifies: {},
        infoTemplates: {},
        featureLayers: {},
        ignoreOtherGraphics: true,
        createDefaultInfoTemplates: true,
        showPopup: true,
        draggable: false,
        returnFieldName: false,
        returnUnformattedValues: false,
        layerSeparator: '||',
        allLayersId: '***',
        excludedFields: [
            'objectid', 'esri_oid', 'shape',
            'shape.len', 'shape_length',
            'shape_len', 'shape.stlength()',
            'shape.area', 'shape_area', 'shape.starea()'
        ],
        /**
         * field type mappings to their default formatter functions
         * overriding this object will globally replace the default
         * formatter function for the field type
         * @type {Object<Function>}
         */
        defaultFormatters: {
            'esriFieldTypeSmallInteger': Formatters.formatInt,
            'esriFieldTypeInteger': Formatters.formatInt,
            'esriFieldTypeSingle': Formatters.formatFloat,
            'esriFieldTypeDouble': Formatters.formatFloat,
            'esriFieldTypeDate': Formatters.formatDate
        },

        postCreate: function () {
            this.inherited(arguments);
            if (!this.identifies) {
                this.identifies = {};
            }
            this.layers = [];
            this.addLayerInfos(this.layerInfos);

            this.own(topic.subscribe('mapViewClickMode/currentSet', lang.hitch(this, 'setMapViewClickMode')));
            this.own(topic.subscribe('identify/addLayerInfos', lang.hitch(this, 'addLayerInfos')));
            this.own(topic.subscribe('identify/removeLayerInfos', lang.hitch(this, 'removeLayerInfos')));

            this.view.on('click', lang.hitch(this, function (evt) {
                if (this.mapViewClickMode === 'identify' && evt.button == 0) {
                    this.executeIdentifyTask(evt);
                }
            }));
            if (this.mapViewRightClickMenu) {
                this.addmapViewRightClickMenu();
            }

            // rebuild the layer selection list when the map is updated
            // but only if we have a UI
            if (this.parentWidget) {
                this.createIdentifyLayerList();

               // this.map.on('update-end', lang.hitch(this, function () {
               //     this.createIdentifyLayerList();
               // }));

                this.view.on('layerview-create', (evt) => {
                    // layerview created!
                    //console.log('layerview created', evt);
                    evt.layerView.watch('updating', (e) => {
                        this.createIdentifyLayerList();
                    });
                });               
            }

            if (this.draggable) {
                this.setupDraggable();
            } 
        },
        /**
         * handles an array of layerInfos to call addLayerInfo for each layerInfo
         * @param {Array<layerInfo>} layerInfos The array of layer infos
         * @returns {undefined}
         */
        addLayerInfos: function (layerInfos) {
            array.forEach(layerInfos, lang.hitch(this, 'addLayerInfo'));
        },
        /**
         * Initializes an infoTemplate on a layerInfo.layer object if it doesn't
         * exist already.
         * @param {object} layerInfo A cmv layerInfo object that contains a layer property
         * @return {undefined}
         */
        addLayerInfo: function (layerInfo) {
            var lyrId = layerInfo.layer.id;
            var layer = this.view.map.findLayerById(lyrId);
            var infoTemplate = null;

            if (layer) {
                var url = layer.url;

                // handle feature layers
                if (layer.declaredClass === 'esri.layers.FeatureLayer') {

                    // If is a feature layer that does not support
                    // Identify (Feature Service), create an
                    // infoTemplate for the graphic features. Create
                    // it only if one does not already exist.
                    if (layer.capabilities && layer.capabilities.data) {
                        if (!layer.popupTemplate) {
                            infoTemplate = this.getInfoTemplate(layer, layer.layerId);
                            if (infoTemplate) {
                                layer.popupTemplate = infoTemplate;
                                var fieldInfos = infoTemplate.fieldInfos;
                                var formatters = array.filter(fieldInfos, function (info) {
                                    return (info.formatter);
                                });
                                if (formatters.length > 0) {
                                    layer.on('graphic-draw', lang.hitch(this, 'getFormattedFeature', layer.infoTemplate));
                                }
                            }
                        }
                    }

                    // If it is a feature Layer, we get the base url
                    // for the map service by removing the layerId.
                    if (url) {
                        var lastSL = url.lastIndexOf('/' + layer.id);
                        if (lastSL > 0) {
                            url = url.substring(0, lastSL);
                        }
                    }
                } else if (layer.sublayers && layer.sublayers.length > 1) {
                    //array.forEach(layer.sublayers.items, lang.hitch(this, function (subLayerInfo) {
                    array.forEach(layer.allSublayers.items, lang.hitch(this, function (subLayerInfo) {
                        var subLayerId = subLayerInfo.id;
                        if ((typeof layerInfo.layerIds === 'undefined') || (array.indexOf(layerInfo.layerIds, subLayerId) >= 0)) {
                            this.getFeatureLayerForDynamicSublayer(layer, subLayerId);
                        }
                    }));
                }

                // rebuild the layer selection list when any layer is hidden
                // but only if we have a UI
                var listeners = [];
                if (this.parentWidget) {
                    //var listener = layer.on('visibility-change', lang.hitch(this, function (evt) {
                    var listener = layer.on('visible', lang.hitch(this, function (evt) {
                        if (evt.visible === false) {
                            this.createIdentifyLayerList();
                        }
                    }));
                    listeners.push(listener);
                }

                this.layers.push({
                    ref: layer,
                    layerInfo: layerInfo,
                    //identifyTask: (url) ? new IdentifyTask(url) : null,
                    //identifyTask: (url) ? identify.identify(url, this.createIdentifyParams([0,0])) : null,
                    identifyTaskUrl: (url) ? url : null,
                    listeners: listeners
                });
            }
        },
        /**
         * handles an array of layerInfos to call removeLayerInfo for each layerInfo
         * @param {Array<layerInfo>} layerInfos The array of layer infos
         * @returns {undefined}
         */
        removeLayerInfos: function (layerInfos) {
            array.forEach(layerInfos, lang.hitch(this, 'removeLayerInfo'));
        },
        removeLayerInfo: function (layerInfo) {
            var lyrId = layerInfo.id;
            var layers = [], listeners = null;
            array.forEach(this.layers, function (layer) {
                if (layer.ref.id !== lyrId) {
                    layers.push(layer);
                } else {
                    listeners = layer.listeners;
                }
            });

            if (layers.length !== this.layers.length) {
                this.layers = layers;
            }
            // remove any listeners
            if (listeners) {
                array.forEach(listeners, function (listener) {
                    if (listener.remove) {
                        listener.remove();
                    }
                });
            }
        },
        addmapViewRightClickMenu: function () {
            //this.map.on('MouseDown', lang.hitch(this, function (evt) {
            //    this.mapRightClick = evt;
            //}));
            this.view.on('pointer-down', lang.hitch(this, function (evt) {
                this.mapViewRightClick = evt;
            }));
            this.mapViewRightClickMenu.addChild(new MenuItem({
                label: this.i18n.rightClickMenuItem.label,
                onClick: lang.hitch(this, 'handleRightClick')
            }));
        },
        setupDraggable: function () {
            var popups = null,
                handles = null,
                pointers = null,
                movable = null;
            // the popup, handle (title) and pointers (arrows)
            popups = query('div.esriPopup');
            handles = query('div.esriPopup div.titlePane div.title');
            pointers = query('div.esriPopup div.outerPointer, div.esriPopup div.pointer');

            if (popups.length > 0 && handles.length > 0) {
                domStyle.set(handles[0], 'cursor', 'move');
                movable = new Moveable(popups[0], {
                    handle: handles[0]
                });

                if (pointers.length > 0) {
                    // hide the pointer arrow when you move the popup
                    movable.onMoveStart = function () {
                        array.forEach(pointers, function (pointer) {
                            domClass.remove(pointer, 'left right top bottom topLeft topRight bottomLeft bottomRight');
                        });
                    };
                }
            }
        },
        executeIdentifyTask: function (evt) {
            var mapPoint = evt.mapPoint;
            var identifyParams = this.createIdentifyParams(mapPoint);
            var identifies = [];
            var identifiedlayers = [];
            var selectedLayer = this.getSelectedLayer();

            if (!this.checkForGraphicInfoTemplate(evt)) {
                // return;
                var layer = array.filter(this.layers, function (l) {
                    return l.ref.id === evt.graphic._layer.id;
                })[0];
                if (!layer) {
                    topic.publish('identify/results', {
                        features: [{ feature: evt.graphic }]
                    });
                    if (!this.showPopup) {
                        this.view.popup.visible = false;
                    }
                    return;
                }
                identifiedlayers.push(layer);
                var d = new Deferred();
                identifies.push(d.promise);
                d.resolve([{ feature: evt.graphic }]);
            }

            this.view.popup.visible = false;
            //  this.view.popup.clear();

            // don't identify on shift-click, ctrl-click or alt-click
            if (evt.shiftKey || evt.ctrlKey || evt.altKey) {
                return;
            }

            array.forEach(this.layers, lang.hitch(this, function (lyr) {
                if (lyr.layerInfo.layer.type != 'graphics') {
                    var layerIds = this.getLayerIds(lyr, selectedLayer);
                    if (layerIds.length > 0) {
                        if (lyr.layerInfo.layer.type != 'feature') {
                            //var params = lang.clone(identifyParams);
                            var params = this.createIdentifyParams(mapPoint);

                            params.identifyTaskUrl = lyr.identifyTaskUrl;

                            // params.layerDefinitions = lyr.ref.layerDefinitions;
                            params.layerIds = layerIds;
                            params.returnFieldName = (typeof lyr.layerInfo.returnFieldName !== 'undefined') ? lyr.layerInfo.returnFieldName : this.returnFieldName;
                            params.returnUnformattedValues = (typeof lyr.layerInfo.returnUnformattedValues !== 'undefined') ? lyr.layerInfo.returnUnformattedValues : this.returnUnformattedValues;
                            if (lyr.ref.timeInfo && lyr.ref.timeInfo.timeExtent && this.view.timeExtent) {
                                params.timeExtent = new TimeExtent(this.view.timeExtent.startTime, this.view.timeExtent.endTime);
                            }

                            //identifies.push(lyr.identifyTask.execute(params));
                            identifies.push(identify.identify(params.identifyTaskUrl, params));
                            identifiedlayers.push(lyr);

                        } else {

                            var query = lyr.layerInfo.layer.createQuery();
                            query.geometry = mapPoint;  // the point location of the pointer
                            var tol = (this.view.extent.width / this.view.width) * this.identifyTolerance;
                            //query.distance = 100;
                            query.distance = tol;
                            query.units = "meters";
                            query.spatialRelationship = "intersects";  // this is the default
                            query.returnGeometry = true;
                            query.outFields = ["*"];
                            query.outSpatialReference = this.view.spatialReference;
  
                            identifies.push(lyr.layerInfo.layer.queryFeatures(query));
                            identifiedlayers.push(lyr);
                        }
                    }
                }                
            }));

            topic.publish('identify/execute', {
                event: evt,
                identifies: identifies,
                identifiedlayers: identifiedlayers
            });

            if (identifies.length > 0) {
                if (this.showPopup) {
                    this.view.popup.title = this.i18n.mapInfoWindow.identifyingTitle;
                    this.view.popup.content = '<div class="loading fas fa-spinner fa-pulse"></div>';
                   // this.view.popup.open(mapPoint);

                    this.view.openPopup();  
                }
                all(identifies).then(lang.hitch(this, 'identifyCallback', identifiedlayers), lang.hitch(this, 'identifyError'));
            }
        },

        checkForGraphicInfoTemplate: function (evt) {
            if (evt.graphic) {
                // handle feature layers that come from a feature service
                // and may already have an info template
                var layer = evt.graphic._layer;
                if (layer.infoTemplate || (layer.capabilities && layer.capabilities.data)) {
                    return false;
                }

                if (!this.ignoreOtherGraphics) {
                    // handles graphic from another type of graphics layer
                    // added to the map and so the identify is not found
                    if (!this.identifies.hasOwnProperty(layer.id)) {
                        return false;
                    }
                    // no layerId (graphics) or sublayer not defined
                    if (isNaN(layer.id) || !this.identifies[layer.id].hasOwnProperty(layer.id)) {
                        return false;
                    }
                }

            }
            return true;
        },

        createIdentifyParams: function (point) {
            var identifyParams = new IdentifyParameters();
            identifyParams.tolerance = this.identifyTolerance;
            identifyParams.returnGeometry = true;
            //identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
            //identifyParams.layerOption ='top';
            identifyParams.layerOption = this.identifyLayerOption;
            identifyParams.geometry = point;
            identifyParams.mapExtent = this.view.extent;
            identifyParams.width = this.view.width;
            identifyParams.height = this.view.height;
            identifyParams.spatialReference = this.view.spatialReference;

            return identifyParams;
        },

        getSelectedLayer: function () {
            var selectedLayer = this.allLayersId; // default is all layers
            // if we have a UI, then get the selected layer
            if (this.parentWidget) {
                var form = this.identifyFormDijit.get('value');
                if (!form.identifyLayer || form.identifyLayer === '') {
                    this.identifyLayerDijit.set('value', selectedLayer);
                } else {
                    selectedLayer = form.identifyLayer;
                }
            }
            return selectedLayer;
        },

        getLayerIds: function (layer, selectedLayer) {
            var arrIds = selectedLayer.split(this.layerSeparator);
            var allLayersId = this.allLayersId;
            var ref = layer.ref,
                selectedIds = layer.layerInfo.layerIds;
            var layerIds = [];
            if (ref.visible) {
                if (arrIds[0] === allLayersId || ref.id === arrIds[0]) {
                    if (arrIds.length > 1 && arrIds[1]) { // layer explicity requested
                        layerIds = [arrIds[1]];
                        //} else if ((ref.declaredClass === 'esri.layers.FeatureLayer') && !isNaN(ref.id)) { // feature layer
                    } else if ((ref.declaredClass === 'esri.layers.FeatureLayer') && isNaN(ref.id)) { // feature layer
                        // do not allow feature layer that does not support
                        // Identify (Feature Service)
                        if (ref.capabilities && ref.capabilities.data) {
                            layerIds = [ref.id];
                        }
                    } else if (ref.sublayers && ref.sublayers.length > 1) {
                        layerIds = this.getLayerInfos(layer, selectedIds);
                    }
                }
            }
            return layerIds;
        },

        getLayerInfos: function (layer, selectedIds) {
            var layerIds = [],
                ref = layer.ref;

            if (ref.allSublayers && ref.allSublayers.length > 0)
            {
                array.forEach(ref.allSublayers.items, lang.hitch(this, function (layerInfo) {
                    if (!this.includeSubLayer(layerInfo, layer, selectedIds)) {
                        return;
                    }
                    layerIds.push(layerInfo.id);
                }));
            }
            
            return layerIds;

        },

        identifyCallback: function (identifiedlayers, responseArray) {
            var fSet = [];
            var visible = false;
            array.forEach(responseArray, function (response, i) {
                var ref = identifiedlayers[i].ref;          

                if (response.features && response.features.length > 0) {
                    // query response
                    var features = response.features;

                    array.forEach(features, function (feature) {
                        //feature.geometry.spatialReference = this.view.spatialReference; //temp workaround for ags identify bug. remove when fixed.
                        //var feature = result.feature;
                        if (feature.popupTemplate === null || typeof feature.popupTemplate === 'undefined') {
                            var infoTemplate = this.getInfoTemplate(ref, feature.layer.id, null);
                            if (infoTemplate) {
                                if ((typeof ref.id === 'number') && ref.layerInfos && infoTemplate.info.showAttachments) {
                                    result.feature._layer = this.getFeatureLayerForDynamicSublayer(ref, feature.layer.id);
                                }
                                var featureInfoTemplate = this.buildExpressionInfos(lang.clone(infoTemplate), feature);
                                //feature.setInfoTemplate(featureInfoTemplate);
                                feature.popupTemplate = featureInfoTemplate;
                            } else {
                                return;
                            }
                        }
                        if (feature && feature.popupTemplate && feature.popupTemplate.info) {
                            feature = this.getFormattedFeature(feature);
                        }
                        fSet.push(feature);
                        visible = true;
                    }, this);

                } else {
                    array.forEach(response.results, function (result) {
                        //result.feature.geometry.spatialReference = this.view.spatialReference; //temp workaround for ags identify bug. remove when fixed.
                        var feature = result.feature;
                        if (feature.popupTemplate === null || typeof feature.popupTemplate === 'undefined') {
                            var infoTemplate = this.getInfoTemplate(ref, null, result);
                            if (infoTemplate) {
                                if ((typeof result.id === 'number') && ref.layerInfos && infoTemplate.info.showAttachments) {
                                    result.feature._layer = this.getFeatureLayerForDynamicSublayer(ref, result.id);
                                }
                                var featureInfoTemplate = this.buildExpressionInfos(lang.clone(infoTemplate), feature);
                                //feature.setInfoTemplate(featureInfoTemplate);
                                feature.popupTemplate = featureInfoTemplate;                                
                            } else {
                                return;
                            }
                        }
                        if (feature && feature.popupTemplate && feature.popupTemplate.info) {
                            feature = this.getFormattedFeature(feature);
                        }
                        fSet.push(feature);
                        visible = true;
                    }, this);
                }
            }, this);

            if (has('phone')) {
         //       this.view.popup.dockOptions.breakpoint.width = 200;
         //
                 this.view.popup.position = 'bottom-center';
                 this.view.popup.collapsed = false;
            }
           
            if (fSet.length > 0) {
                this.view.popup.features = fSet;
                this.view.popup.visible = visible;
            } else {
                this.view.popup.visible = visible;
            } 
            
            topic.publish('identify/results', {
                features: fSet,
                responseArray: responseArray,
                identifiedlayers: identifiedlayers
            });
        },
        getFormattedFeature: function (feature) {
            var infoTemplate = feature.infoTemplate;
            if (feature.graphic) {
                feature = feature.graphic;
            }
            array.forEach(infoTemplate.info.fieldInfos, function (info) {
                if (typeof info.formatter === 'function') {
                    feature.attributes[info.fieldName] = info.formatter(feature.attributes[info.fieldName], feature.attributes, lang.clone(feature.geometry));
                }
            });
            return feature;
        },
        buildExpressionInfos: function (infoTemplate, feature) {
            if (feature.graphic) {
                feature = feature.graphic;
            }
            if (feature && infoTemplate && infoTemplate.info && (typeof infoTemplate.getExpressionInfo === 'function')) {
                var info = infoTemplate.info;
                var expressionInfos = info.expressionInfos || [];
                array.forEach(info.fieldInfos, function (fieldInfo) {
                    if (typeof fieldInfo.formatter === 'function' && fieldInfo.useExpression !== false) {
                        var name = fieldInfo.fieldName.toLowerCase() + '-formatted';
                        var expression = 'return \'' + fieldInfo.formatter(feature.attributes[fieldInfo.fieldName], feature.attributes, lang.clone(feature.geometry)) + '\'';
                        fieldInfo.fieldName = 'expression/' + name;
                        expressionInfos = array.filter(expressionInfos, function (expressionInfo) {
                            return (expressionInfo.name !== name);
                        });
                        expressionInfos.push({
                            name: name,
                            title: fieldInfo.label || ' ',
                            expression: expression
                        });
                        fieldInfo.formatter = null;
                    }
                });
                info.expressionInfos = expressionInfos;
                infoTemplate = new PopupTemplate(info);
            }
            return infoTemplate;
        },
        identifyError: function (err) {
            //this.map.infoWindow.hide();
            this.view.popup.visible = false;

            topic.publish('viewer/handleError', {
                source: 'Identify',
                error: err
            });
            topic.publish('identify/error', {
                error: err
            });
        },
        handleRightClick: function () {
            this.executeIdentifyTask(this.mapViewRightClick);
        },

        getInfoTemplate: function (layer, layerId, result) {
            var popup = null,
                config = null;
            if (result) {
                layerId = typeof result.layerId === 'number' ? result.layerId : layer.layerId;
            } else if (layerId === null) {
                layerId = layer.layerId;
            }

            var ids = this.identifies;
            if (ids.hasOwnProperty(layer.id)) {
                if (ids[layer.id].hasOwnProperty(layerId)) {
                    popup = ids[layer.id][layerId];
                    if (popup instanceof PopupTemplate) {
                        return popup;
                    }
                }
            } else {
                ids[layer.id] = {};
            }

            // by mixin in the users config with the default props we can
            // generate a config object that provides the basics automatically
            // while letting the user override only the parts they want...like mediaInfos
            config = lang.mixin(this.createDefaultInfoTemplate(layer, layerId, result), ids[layer.id][layerId] || {});

            //popup = ids[layer.id][layerId] = new PopupTemplate(config);
            /*if (config.content) {
                popup.content = config.content;
            }*/
           

            var popupTemplate = new PopupTemplate({
                // autocasts as new PopupTemplate()
                title: config.title,
                outFields: ["*"],
                content: [{
                    // It is also possible to set the fieldInfos outside of the content
                    // directly in the popupTemplate. If no fieldInfos is specifically set
                    // in the content, it defaults to whatever may be set within the popupTemplate.
                    type: "fields",
                    fieldInfos: config.fieldInfos
                }]
            });

            popup = ids[layer.id][layerId] = popupTemplate;

            return ids[layer.id][layerId];
        },

        createDefaultInfoTemplate: function (layer, layerId, result) {
            var popup = null,
                fieldInfos = [];

            var layerName = this.getLayerName(layer);
            if (result) {
                layerName = result.layerName;
            }

            // from the results
            if (result && result.feature) {
                var attributes = result.feature.attributes;
                if (attributes) {
                    for (var prop in attributes) {
                        if (attributes.hasOwnProperty(prop)) {
                            this.addDefaultFieldInfo(fieldInfos, {
                                fieldName: prop,
                                label: this.makeSentenceCase(prop),
                                visible: true
                            });
                        }
                    }
                }

                // from the outFields of the layer
            } else if (layer._outFields && (layer._outFields.length) && (layer._outFields[0] !== '*')) {

                var fields = layer.fields;
                array.forEach(layer._outFields, lang.hitch(this, function (fieldName) {
                    var foundField = array.filter(fields, function (field) {
                        return (field.name === fieldName);
                    });
                    if (foundField.length > 0) {
                        this.addDefaultFieldInfo(fieldInfos, {
                            fieldName: foundField[0].name,
                            label: foundField[0].alias,
                            visible: true
                        });
                    }
                }));

                // from the fields layer
            } else if (layer.fields) {

                array.forEach(layer.fields, lang.hitch(this, function (field) {
                    this.addDefaultFieldInfo(fieldInfos, {
                        fieldName: field.name,
                        label: field.alias === field.name ? this.makeSentenceCase(field.name) : field.alias,
                        visible: field.visible, //true,
                        editable: field.editable
                    });
                }));
            }

            if (fieldInfos.length > 0) {
                popup = {
                    title: layerName,
                    fieldInfos: fieldInfos,
                    showAttachments: (layer.hasAttachments)
                };
            }

            return popup;
        },
        /**
         * converts a string to a nice sentence case format
         * @url http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
         * @param  {string} str The string to convert
         * @return {string}     The converted string
         */
        makeSentenceCase: function (str) {
            if (!str.length) {
                return '';
            }
            str = str.toLowerCase().replace(/_/g, ' ').split(' ');
            for (var i = 0; i < str.length; i++) {
                str[i] = str[i].charAt(0).toUpperCase() + (str[i].substr(1).length ? str[i].substr(1) : '');
            }
            return (str.length ? str.join(' ') : str);
        },

        addDefaultFieldInfo: function (fieldInfos, field) {
            var nameLC = field.fieldName.toLowerCase();
            if (array.indexOf(this.excludedFields, nameLC) < 0) {
                fieldInfos.push(field);
            }
        },

        createIdentifyLayerList: function () {
            var id = null;
            var identifyItems = [];
            var selectedId = this.identifyLayerDijit.get('value');
            var sep = this.layerSeparator;

            array.forEach(this.layers, lang.hitch(this, function (layer) {
                var ref = layer.ref,
                    selectedIds = layer.layerInfo.layerIds;
                // only include layers that are currently visible
                if (ref.visible) {
                    var name = this.getLayerName(layer);
                    //if ((ref.declaredClass === 'esri.layers.FeatureLayer') && !isNaN(ref.id)) { // feature layer
                    if ((ref.declaredClass === 'esri.layers.FeatureLayer') && isNaN(ref.id)) { // feature layer
                        identifyItems.push({
                            name: name,
                            id: ref.id + sep + ref.id
                        });
                        // previously selected layer is still visible so keep it selected
                        if (ref.id + sep + ref.id === selectedId) {
                            id = selectedId;
                        }
                    } else { // dynamic layer
                        if (ref.sublayers && ref.sublayers.length > 1) {
                            array.forEach(ref.sublayers.items, lang.hitch(this, function (layerInfo) {
                                if (!this.includeSubLayer(layerInfo, layer, selectedIds)) {
                                    return;
                                }
                                identifyItems.push({
                                    name: name + ' \\ ' + layerInfo.title,
                                    id: ref.id + sep + layerInfo.id
                                });
                                // previously selected sublayer is still visible so keep it selected
                                if (ref.id + sep + layerInfo.id === selectedId) {
                                    id = selectedId;
                                }
                            }));
                        }
                    }
                }
            }));

            identifyItems.sort(function (a, b) {
                return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
            });

            this.identifyLayerDijit.set('disabled', (identifyItems.length < 1));
            if (identifyItems.length > 0) {
                identifyItems.unshift({
                    name: this.i18n.labels.allVisibleLayers,
                    id: '***'
                });
                if (!id) {
                    id = identifyItems[0].id;
                }
            }
            var identify = new Memory({
                data: identifyItems
            });
            this.identifyLayerDijit.set('store', identify);
            this.identifyLayerDijit.set('value', id);
        },

        includeSubLayer: function (layerInfo, layer, selectedIds) {
            // exclude group layers
            var id = Number(layerInfo.id);
            if (isNaN(id)) {
                return false;
            }
            var ref = layer.ref;

            // visible layers
            var vizlayers = [];
            array.forEach(ref.allSublayers.items, function (sublayer) {
                if (sublayer.visible) {
                    vizlayers.push(sublayer.id);  
                }
            });
            
            if (this.isDefaultLayerVisibility(ref) && !this.checkVisibilityRecursive(layer, layerInfo.id)) {
                return false;
            //} else if (array.indexOf(ref.visibleLayers, layerInfo.id) < 0) {
            //} else if (!ref.visible) {
            } else if (array.indexOf(vizlayers, layerInfo.id) < 0) {
                return false;
            }
            // only include sublayers that are within the current map scale
            if (!this.layerVisibleAtCurrentScale(layerInfo)) {
                return false;
            }

            // restrict which layers are included
            if (selectedIds) {
                if (array.indexOf(selectedIds, layerInfo.id) < 0) {
                    return false;
                }
            }

            // don't allow the layer if we don't have an  infoTemplate
            // already and creating a default one is not desired
            if (!this.createDefaultInfoTemplates) {
                var infoTemplate = this.getInfoTemplate(ref, layerInfo.id);
                if (!infoTemplate) {
                    return false;
                }
            }

            // all tests pass so include this sublayer
            return true;
        },

        /**
         * recursively check all a layer's parent(s) layers for visibility
         * this only needs to be done if the layers visibleLayers array is
         * set to the default visibleLayers. After setVisibleLayers
         * is called the first time group layers are NOT included.
         * @param  {object} layer layerInfo reference
         * @param  {Integer} id   The sublayer id to check for visibility
         * @return {Boolean}      Whether or not the sublayer is visible based on its parent(s) visibility
         */
        checkVisibilityRecursive: function (layer, id) {
            var ref = layer.ref;
            var layerInfos = array.filter(ref.allSublayers.items, function (layerInfo)
            {
                if (layerInfo.visible)
                {
                    return (layerInfo.id === id);
                }                
            });
            if (layerInfos.length > 0) {
                var info = layerInfos[0];
                //if ((ref.visibleLayers.indexOf(id) !== -1) && (layer.layerInfo.ignoreDynamicGroupVisibility || info.parentLayerId === -1 || this.checkVisibilityRecursive(layer, info.parentLayerId))) {
                var pid = Number(info.parent.id);
                if (isNaN(pid)) {
                    pid = -1;
                }

                if ((layer.layerInfo.ignoreDynamicGroupVisibility || pid === -1 || this.checkVisibilityRecursive(layer, pid))) {
                    return true;
                }
            }
            return false;
        },
        /**
         * check each defaultVisibility and if its not in the visibleLayers
         * array, then the layer has non-default layer visibility
         * @param  {esri/layers/DynamicMapServiceLayer} layer The layer reference
         * @return {Boolean}       Whether or not we're operating with the default visibleLayers array or not
         */
        isDefaultLayerVisibility: function (layer) {
            for (var i = 0; i < layer.sublayers.length; i++) {
                var item = layer.sublayers.items[i];  

                if (item.listMode == 'show' && !item.visible) {
                    return false;
                }
            }
            return true;

            /*for (var i = 0; i < layer.allSublayers.length; i++) {
                var item = layer.allSublayers.items[i];
                if (!item.visible) {
                    return false;
                }
            }
            return true;*/


            /*
            for (var i = 0; i < layer.sublayers.length; i++) {
                var item = layer.sublayers.items[i];
                if (item.visible)
                {
                    return true;
                }
                //var item = layer.sublayers.items[i];
                //if (item.defaultVisibility && layer.visibleLayers.indexOf(item.id) === -1) {
                //    return false;
                //}
            }*/

            return false;
            //return true;
        },

        getLayerName: function (layer) {
            var name = null;
            if (layer.title) {
                name = layer.title;
            }
            if (!name) {
                array.forEach(this.layers, function (lyr) {
                    if (lyr.ref.id === layer.id) {
                        name = lyr.layerInfo.title;
                        return;
                    }
                });
            }
            if (!name) {
                name = layer.name;
                if (!name && layer.ref) {
                    name = layer.ref.title; // fall back to old method using title from legend
                }
            }
            return name;
        },

        getFeatureLayerForDynamicSublayer: function (layer, layerId) {
            if (!layer.sublayers) {
                return false;
            }
            var key = layer.url + '/' + layerId;
            if (!this.featureLayers.hasOwnProperty(key)) {
                this.featureLayers[key] = new FeatureLayer(key);
            }
            return this.featureLayers[key];
        },

        layerVisibleAtCurrentScale: function (layer) {
            var mapScale = this.view.scale;
            return !(((layer.maxScale !== 0 && mapScale < layer.maxScale) || (layer.minScale !== 0 && mapScale > layer.minScale)));
        },

        setMapViewClickMode: function (mode) {
            this.mapViewClickMode = mode;
            var map = this.view.map;
            array.forEach(map.graphicsLayerIds, function (layerID) {
                var layer = map.findLayerById(layerID);
                if (layer) {
                    // add back any infoTemplates that
                    // had been previously removed
                    if (mode === 'identify') {
                        if (this.infoTemplates[layer.id]) {
                            layer.infoTemplate = lang.clone(this.infoTemplates[layer.id]);
                        }
                        // remove any infoTemplates that might
                        // interfere with clicking on a feature
                    } else if (layer.infoTemplate) {
                        this.infoTemplates[layer.id] = lang.clone(layer.infoTemplate);
                        layer.infoTemplate = null;
                    }
                }
            }, this);
        }
    });
});

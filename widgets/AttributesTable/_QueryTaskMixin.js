define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/topic',
    'dojo/Deferred',

    'esri/request',
    'esri/config',
    'esri/core/units',
    'esri/rest/geometryService',
    'dojo/number',
    'esri/rest/support/Query',
    'esri/rest/support/RelationshipQuery',
    'esri/rest/query',
    'esri/geometry/Point',
    'esri/geometry/Multipoint',
    'esri/geometry/Polyline',
    'esri/geometry/Polygon',
    'esri/geometry/Extent',
    'esri/geometry/geometryEngine',
    'esri/rest/support/BufferParameters'

], function (
    declare,
    lang,
    array,
    topic,
    Deferred,

    esriRequest,
    esriConfig,
    units,
    geometryService,
    num,
    Query,
    RelationshipQuery,
    query,
    Point,
    Multipoint,
    Polyline,
    Polygon,
    Extent,
    geometryEngine,
    BufferParameters
) {

    return declare(null, {

        results: null,

        queryOptions: {},

        // for all the standard parameters, see for https://developers.arcgis.com/javascript/jsapi/query-amd.html
        defaultQueryOptions: {
            queryParameters: {
                type: 'spatial',
                outputSpatialReference: 4326,
                url: null,
                layerID: null,
                sublayerID: null,
                objectIDs: null,
                outFields: ['*'],
                where: '1=1',
                addToExisting: false,
                geometry: null,
                distance: null,
                start: null,
                num: null,
                text: null,
                timeExtent: null,
                units: 'feet',
                geometryPrecision: 2,
                groupByFieldsForStatistics: null,
                orderByFields: null,
                outStatistics: null,
                pixelSize: null,
                relationParam: null,
                spatialRelationship: Query.SPATIAL_REL_INTERSECTS,
                includeLayerDefinitions: false
            },

            // provide the parameters if there is a spatial query linked from a table/database query
            linkedQuery: {
                url: null,
                layerID: null,
                sublayerID: null,
                linkField: null,
                idProperty: null,
                linkIDs: [] // if linkedQuery, then store the linkedIDs for use in linked query
            },

            // allow a buffer to be performed before a spatial
            // query and then use the buffer geometry in the query
            // if showOnly = true, the buffer is displayed  but
            // the query is not run
            bufferParameters: {
                distance: null,
                unit: null,
                geodesic: true,
                showOnly: false
            },

            // executing a linked query?
            isLinkedQuery: false,

            // used for linkedQueries
            linkField: null,

            // default Unique ID
            // if null, will attempt to get a field of
            // type 'esriFieldTypeOID' from the results
            idProperty: null

        },

        isLinkedQuery: false,

        relatedTableURL: null,

        layerJSON: {},

        getQueryConfiguration: function (options) {
            options = this.mixinDeep(lang.clone(this.defaultQueryOptions), options);

            this.queryParameters = options.queryParameters;
            this.bufferParameters = options.bufferParameters;
            this.idProperty = options.idProperty;

            this.linkField = options.linkField;
            this.linkedQuery = options.linkedQuery;
            this.isLinkedQuery = false;
            this.relatedTableURL = null;
        },

        executeQueryTask: function (options) {
            this.getConfiguration(options);
            if (this.executingQuery === true) {
                return;
            }

            var qp = this.getQueryParameters(options);

            if (this.featureOptions.buffer && this.bufferParameters && this.bufferParameters.distance) {
                this.executeBuffer();
                return;
            }
            this.featureOptions.buffer = false;

            var url = this.getQueryTaskURL();
            if (!url) {
                return;
            }

            // get feature layer for retrieving coded domain values later
            // method continues even if there is an error loading the layer
            var deferred = this.getLayerJSON(url);

            deferred.then(lang.hitch(this, function () {
                //var qt = new query(url);
                var q = this.buildQueryFromParameters(qp);

                if (qp.type === 'relationship') {
                    var relatedDeferred = this.getRelationshipLayerJSON(url, qp);
                    relatedDeferred.then(lang.hitch(this, function () {
                        this.executingQuery = true;
                        this.growlQueryIsExecuting();

                        var querydeferred = query.executeRelationshipQuery(url, q);
                        querydeferred.then(lang.hitch(this, 'processQueryResults'), lang.hitch(this, 'processQueryError'));
                    }));

                } else {
                    this.executingQuery = true;
                    this.growlQueryIsExecuting();

                    var querydeferred = query.executeQueryJSON(url, q);
                    querydeferred.then(lang.hitch(this, 'processQueryResults'), lang.hitch(this, 'processQueryError'));
                }
            }));

        },

        getQueryParameters: function (options) {
            // grab the query parameters
            if (options && options.queryOptions && options.queryOptions.queryParameters) {
                this.queryParameters = options.queryOptions.queryParameters;
            }

            var qp = this.queryParameters;

            // only clear everything when we want to preserve the previous results
            if (qp.addToExisting !== true && !qp.bufferGeometry) {
                this.clearAll();
            }

            this.getConfiguration(options);
            qp = this.queryParameters;

            if (qp.addToExisting !== true) {
                this.clearFeatures();
            }
            this.clearSelectedFeatures();
            if ((qp.addToExisting !== true) && (this.isLinkedQuery !== true || this.type === 'table') && (this.bufferParameters && !this.bufferParameters.showOnly)) {
                this.clearGrid();
            }

            if (qp.geometry) {
                qp.geometry = this.createGeometry(qp.geometry);
            }
            return qp;
        },

        growlQueryIsExecuting: function () {
            if (this.growlOptions.loading && !this.isLinkedQuery) {
                this.growlID = this.topicID + 'Growl-StartSearch';
                var msg = lang.mixin(this.i18n.messages.searching, {
                    id: this.growlID,
                    timeout: (esriConfig.request.timeout + 5000),
                    level: 'info',
                    showProgressBar: true
                });
                topic.publish('growler/growl', msg);
            }
        },

        buildQueryFromParameters: function (qp) {
            var q = null;
            if (qp.type === 'relationship') {
                q = new RelationshipQuery();
            } else {
                q = new Query();
            }

            q.geometryPrecision = qp.geometryPrecision;
            q.maxAllowableOffset = qp.maxAllowableOffset;
            q.objectIds = qp.objectIDs;
            q.outFields = qp.outFields;
            q.outSpatialReference = qp.outSpatialReference || this.view.spatialReference;
            q.returnGeometry = this.featureOptions.features;
            q.where = qp.where;

            if (qp.type === 'spatial') {
                q.distance = qp.distance;
                q.geometry = qp.bufferGeometry || qp.geometry;
                q.groupByFieldsForStatistics = qp.groupByFieldsForStatistics;
                q.num = qp.num;
                q.orderByFields = qp.orderByFields;
                q.outStatistics = qp.outStatistics;
                q.pixelSize = qp.pixelSize;
                q.relationParam = qp.relationParam;
                q.spatialRelationship = qp.spatialRelationship;
                q.start = qp.start;
                q.text = qp.text;
                q.timeExtent = qp.timeExtent;
                q.units = qp.units;

            } else if (qp.type === 'relationship') {
                q.definitionExpression = qp.definitionExpression;
                q.relationshipId = qp.relationshipID;
            }
            return q;
        },

        executeLinkedQuery: function (lq) {
            var qp = this.queryParameters;
            var linkField = lq.linkField || this.linkField;
            var type = lq.type || 'spatial';
            lq.type = type;

            if (!lq.linkIDs) {
                return;
            }
            lq.where = linkField + ' IN (' + lq.linkIDs.splice(',') + ')';
            delete lq.linkedIDs;

            if (!lq.outFields) {
                lq.outFields = [];
            }
            if (lq.returnGeometry !== false && (type === 'spatial')) {
                lq.returnGeometry = true;
            }
            if (!lq.distance && qp.distance) {
                lq.distance = qp.distance;
            }
            if (!lq.units && qp.units) {
                lq.units = qp.units;
            }
            if (!lq.geometry && qp.geometry) {
                lq.geometry = qp.geometry;
            }
            if (!lq.spatialRelationship && qp.spatialRelationship) {
                lq.spatialRelationship = qp.spatialRelationship;
            }

            this.executeQueryTask({
                queryOptions: {
                    queryParameters: lq,
                    isLinkedQuery: true
                }
            });
        },

        executeBuffer: function () {
            this.clearBufferGraphics();

            // experimental use of geometryEngine
            if (this.view.spatialReference.wkid === 4326 || this.view.spatialReference.wkid === 102100) {
                var geometries = geometryEngine.geodesicBuffer(this.queryParameters.geometry, this.bufferParameters.distance, (this.bufferParameters.unit || units.FEET));
                this.processBufferQueryResults([geometries]);
            } else {
                var buffParams = new BufferParameters();
                buffParams.geometries = [this.queryParameters.geometry];
                buffParams.distances = [this.bufferParameters.distance];
                buffParams.unit = this.bufferParameters.unit || units.FEET;
                buffParams.geodesic = this.bufferParameters.geodesic || true;
                buffParams.bufferSpatialReference = this.view.spatialReference;
                buffParams.outSpatialReference = this.view.spatialReference;

                //esriConfig.defaults.geometryService.buffer(buffParams, lang.hitch(this, 'processBufferQueryResults'));
		var handle = geometryService.buffer(esriConfig.geometryServiceUrl, buffParams);
		handle.then(
                     lang.hitch(this, function (result) {
			this.processBufferQueryResults(result);
		     })
		);
             }
        },

        refreshQueryTask: function () {
            this.executeQueryTask(this.queryOptions);
        },

        processQueryError: function (error) {
            this.clearGrowl();
            this.executingQuery = false;

            var msg = lang.mixin(this.i18n.messages.searchError, {
                level: 'error',
                timeout: 5000
            });
            topic.publish('growler/growl', msg);
            topic.publish('viewer/handleError', {
                error: error
            });
        },

        processQueryResults: function (results) {
            this.clearGrowl();
            this.executingQuery = false;

            if (!results) {
                return;
            }

            this.results = results;
            this.getFeaturesFromResults();

            if (!this.idProperty) {
                this.getIdProperty(results);
            }

            var originalRecs = this.getFeatureCount();
            var recCount = this.getFeatureCount();
            if (recCount > 0) {
                if (this.featureOptions.source && this.queryParameters.geometry) {
                    this.addSourceGraphic(this.queryParameters.geometry);
                }
                this.populateGrid(results);
            }

            if (this.growlOptions.results && !this.isLinkedQuery) {
                this.growlQueryResults(recCount, originalRecs);
            }

            topic.publish(this.topicID + '/queryResults', this.results);
            topic.publish(this.attributesContainerID + '/openPane');
            topic.publish(this.attributesContainerID + '/tableUpdated', this);

            if (this.linkedQuery && (this.linkedQuery.url || this.linkedQuery.layerID)) {
                var lq = lang.clone(this.linkedQuery);
                this.executeLinkedQuery(lq);
            } else {
                this.isLinkedQuery = false;
            }

            this.queryParametersType = 'spatial';
            this.linkedQuery = {
                url: null,
                linkIDs: []
            };
        },

        growlQueryResults: function (recCount, originalRecs) {
            var newRecs = (originalRecs === 0) ? 0 : recCount - originalRecs;
            var msgNls = this.i18n.messages.searchResults;
            var msg = msgNls.message;
            if (!msg) {
                if (recCount > 0) {
                    msg = '';
                    if (newRecs > 0) {
                        msg += num.format(newRecs) + ' ' + msgNls.newFeatures + ' ';
                        msg += (newRecs > 1) ? msgNls.features : msgNls.feature;
                        msg += ' ' + msgNls.found + '.<br/>';
                    }
                    msg += num.format(recCount) + ' ';
                    msg += (recCount > 1) ? msgNls.features : msgNls.feature;
                    msg += ' ' + msgNls.found;
                    msg += (newRecs > 0) ? ' ' + msgNls.total + '.' : '.';
                } else {
                    msg = msgNls.noFeatures;
                }
            }

            topic.publish('growler/growl', {
                title: this.title + ' ' + msgNls.title,
                message: msg,
                level: 'info',
                timeout: 5000
            });

        },

        processBufferQueryResults: function (geometries) {
            var showOnly = this.bufferParameters.showOnly;

            // reset the buffer
            this.bufferParameters = lang.clone(this.defaultQueryOptions.bufferParameters);

            if (geometries && geometries.length > 0) {
                this.addBufferGraphic(geometries[0]);

                if (showOnly !== true) {
                    if (this.queryParameters) {
                        this.queryParameters.geometry = this.geometryToJson(this.queryParameters.geometry);
                    }
                    //var qParams = lang.clone(this.queryParameters);
		    var qParams = this.queryParameters;
                    qParams.bufferGeometry = geometries[0];

                    this.executeQueryTask({
                        queryOptions: {
                            queryParameters: qParams,
                            bufferParameters: this.bufferParameters,
                            linkedQuery: this.linkedQuery,
                            linkField: this.linkField,
                            isLinkedQuery: this.isLinkedQuery
                        }
                    });

                } else if (this.featureOptions.source) {
                    this.addSourceGraphic(this.queryParameters.geometry);
                    this.zoomToBufferGraphics();
                }
            }
        },

        // convert geometry to Json to avoid issues when cloning
        geometryToJson: function (geom) {
            if (geom && geom.type && geom.toJson) {
                var type = geom.type;
                geom = geom.toJson();
                geom.type = type;
            }
            return geom;
        },

        // allow geometry to come as Json or a geometry type
        createGeometry: function (geom) {
            var type = geom.type;
            if (geom.toJson) {
                geom = geom.toJson();
            }
            switch (type) {
            case 'point':
                return new Point(geom);
            case 'multipoint':
                return new Multipoint(geom);
            case 'polyline':
                return new Polyline(geom);
            case 'polygon':
                return new Polygon(geom);
            case 'extent':
                return new Extent(geom);
            default:
                geom.type = type;
                return geom;
            }
        },

        getQueryResults: function () {
            return this.results;
        },

        clearQueryResults: function () {
            this.results = null;
        },

        hasLinkedQuery: function () {
            var lq = this.linkedQuery;
            if (this.linkField && lq && lq.linkField) {
                if (!lq.linkIDs) {
                    lq.linkIDs = [];
                }
                return true;
            }
            return false;
        },

        // get the idProperty from an 'esriFieldTypeOID'
        // type of field (if available) in the results
        getIdProperty: function (results) {
            var fields = results.fields;
            if (fields && fields.length > 0) {
                array.forEach(fields, lang.hitch(this, function (field) {
                    if (field.type === 'esriFieldTypeOID') {
                        this.idProperty = field.name;
                    }
                }));
            }
        },

        getQueryTaskLayerJSON: function () {
            if (this.queryParameters.type === 'relationship' && this.relatedTableURL) {
                return this.layerJSON[this.relatedTableURL];
            }
            var url = this.getQueryTaskURL();
            return this.layerJSON[url];
        },

        getQueryTaskURL: function () {
            var qp = this.queryParameters;
            var url = qp.url;

            if (url && qp.sublayerID) {
                var len = url.length;
                if (url.substring(len - 1, len) === '/') {
                    url = url.substring(0, len - 1);
                }
                url += '/' + qp.sublayerID;
            }

            if (!url && qp.layerID) {
                var layer = this.view.map.findLayerById(qp.layerID);
                if (layer) {
                    var whereByLayerDef = null;
                    if (layer.declaredClass === 'esri.layers.FeatureLayer') { // Feature Layer
                        whereByLayerDef = layer.getDefinitionExpression();

                        url = layer.url;
                    } else if (layer.declaredClass === 'esri.layers.ArcGISDynamicMapServiceLayer') { // Dynamic Layer
                        whereByLayerDef = layer.layerDefinitions ? layer.layerDefinitions[qp.sublayerID] : null;


                        if (qp.sublayerID !== null) {
                            url = layer.url + '/' + qp.sublayerID;
                        } else if (layer.visibleLayers && layer.visibleLayers.length === 1) {
                            url = layer.url + '/' + layer.visibleLayers[0];
                        }
                    }

                    if (whereByLayerDef && qp.includeLayerDefinitions) {
                        if (qp.where) {
                            qp.where = '(' + whereByLayerDef + ') AND (' + qp.where + ')';
                        } else {
                            qp.where = whereByLayerDef;
                        }
                    }
                }
            }
            return url;
        },

        getLayerJSON: function (url) {
            var deferred = new Deferred();
            var layerJSON = this.layerJSON;

            if (layerJSON[url]) {
                if (layerJSON[url].promise) {
                    return layerJSON[url].promise;
                }
                deferred.resolve(layerJSON[url]);
            } else {
                layerJSON[url] = deferred;
                esriRequest({
                    url: url,
                    parameters: {
                        f: 'json'
                    },
                    content: {
                        f: 'json'
                    },
                    handleAs: 'json',
                    callbackParamName: 'callback'
                }, {
                    disableIdentityLookup: false,
                    usePost: false,
                    useProxy: false
                }).then(
                    lang.hitch(this, function (data) {
                        layerJSON[url] = data;
                        deferred.resolve(layerJSON[url]);
                    }),
                    lang.hitch(this, function () {
                        layerJSON[url] = {};
                        deferred.resolve(layerJSON[url]);
                    })
                );
            }

            return deferred.promise;
        },

        getRelationshipLayerJSON: function (url, qp) {
            var deferred = new Deferred(),
                relatedDeferred = null,
                layer = this.getQueryTaskLayerJSON();

            if (layer && layer.relationships) {
                var related = layer.relationships[qp.relationshipID];
                if (related) {
                    var lastSlash = url.lastIndexOf('/');
                    this.relatedTableURL = url.substring(0, lastSlash + 1) + related.relatedTableId;
                    relatedDeferred = this.getLayerJSON(this.relatedTableURL);
                    relatedDeferred.then(lang.hitch(this, function () {
                        deferred.resolve();
                    }));

                }
            }
            if (!relatedDeferred) {
                deferred.resolve();
            }
            return deferred.promise;
        }
    });
});
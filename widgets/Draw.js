define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dojo/_base/Color',

    'esri/widgets/Sketch/SketchViewModel',
    'esri/layers/GraphicsLayer',
    'esri/Graphic',
    'esri/renderers/SimpleRenderer',
    'dojo/text!./Draw/templates/Draw.html',
    'esri/renderers/UniqueValueRenderer',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/layers/FeatureLayer',

    'dojo/topic',
    'dojo/aspect',
    'dojo/i18n!./Draw/nls/resource',

    'dijit/form/Button',
    'xstyle/css!./Draw/css/Draw.css',
    'xstyle/css!./Draw/css/adw-icons.css'
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    lang,
    Color,

    SketchViewModel,
    GraphicsLayer,
    Graphic,
    SimpleRenderer,
    drawTemplate,
    UniqueValueRenderer,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    FeatureLayer,

    topic,
    aspect,
    i18n

) {

    // main draw dijit
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: drawTemplate,
        i18n: i18n,
        drawToolbar: null,
        mapViewClickMode: null,
        postCreate: function () {
            this.inherited(arguments);  
            this.createGraphicLayers();

            this.drawToolbar = new SketchViewModel(
                {
                    view: this.view,
                    layer: this.polylineGraphics
                }
            );
            this.drawToolbar.on('draw-end', lang.hitch(this, 'onDrawToolbarDrawEnd'));


            this.own(topic.subscribe('mapViewClickMode/currentSet', lang.hitch(this, 'setMapViewClickMode')));
            if (this.parentWidget && this.parentWidget.toggleable) {
                this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function () {
                    this.onLayoutChange(this.parentWidget.open);
                })));
            }
        },
        createGraphicLayers: function () {
            this.pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([255, 0, 0, 1.0]));
            this.polylineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 1);
            this.polygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.0]));
            this.pointGraphics = new GraphicsLayer({
                id: 'drawGraphics_point',
                title: 'Draw Graphics'
            });
            this.pointRenderer = new SimpleRenderer(this.pointSymbol);
            this.pointRenderer.label = 'User drawn points';
            this.pointRenderer.description = 'User drawn points';
            this.pointGraphics.renderer = this.pointRenderer;
            this.view.map.add(this.pointGraphics);

            this.polylineGraphics = new GraphicsLayer({
                id: 'drawGraphics_line',
                title: 'Draw Graphics'
            });
            this.polylineRenderer = new SimpleRenderer(this.polylineSymbol);
            this.polylineRenderer.label = 'User drawn lines';
            this.polylineRenderer.description = 'User drawn lines';
            this.polylineGraphics.renderer = this.polylineRenderer;
            this.view.map.add(this.polylineGraphics);

            this.polygonGraphics = new GraphicsLayer({
                id: 'drawGraphics_polygon',
                title: 'Draw Graphics'
            });
            this.polygonRenderer = new SimpleRenderer(this.polygonSymbol);
            this.polygonRenderer.label = 'User drawn polygons';
            this.polygonRenderer.description = 'User drawn polygons';
            this.polygonGraphics.renderer = this.polygonRenderer;
            this.view.map.add(this.polygonGraphics);

            /*
            this.polygonGraphics = new FeatureLayer({

                layerDefinition: {
                    geometryType: 'polygon',
                    fields: [{
                        name: 'OBJECTID',
                        type: 'oid',
                        alias: 'OBJECTID',
                        domain: null,
                        editable: false,
                        nullable: false
                    }, {
                        name: 'ren',
                        type: 'integer',
                        alias: 'ren',
                        domain: null,
                        editable: true,
                        nullable: false
                    }]
                },
                featureSet: null
            }, {
                id: 'drawGraphics_poly',
                title: 'Draw Graphics',
                mode: FeatureLayer.MODE_SNAPSHOT
            });
            this.polygonRenderer = new UniqueValueRenderer(new SimpleFillSymbol(), 'ren', null, null, ', ');
            //this.polygonRenderer.addValue({
            this.polygonRenderer.addUniqueValueInfo({
                value: 1,
                symbol: new SimpleFillSymbol({
                    color: [255, 170, 0, 255],
                    outline: {
                        color: [255, 170, 0, 255],
                        width: 1,
                        //type: 'simple-line',
                        style: 'solid'
                    },
                    //type: 'simple-line',
                    style: 'forward-diagonal'
                }),
                label: 'User drawn polygons',
                description: 'User drawn polygons'
            });*/

            this.polygonGraphics.renderer = this.polygonRenderer;
            this.view.map.add(this.polygonGraphics);
        },
        drawPoint: function () {
            this.disconnectMapViewClick();
            this.drawToolbar.create('point',
                {
                    mode: 'click'
                });
            this.drawModeTextNode.innerText = this.i18n.labels.point;
        },
        drawCircle: function () {
            this.disconnectMapViewClick();
            this.drawToolbar.create('circle',
                {
                    mode: 'click'
                });
            this.drawModeTextNode.innerText = this.i18n.labels.circle;
        },
        drawLine: function () {
            this.disconnectMapViewClick();
            this.drawToolbar.create('polyline',
                {
                    mode: 'click'
                });
            this.drawModeTextNode.innerText = this.i18n.labels.polyline;
        },
        drawFreehandLine: function () {
            this.disconnectMapViewClick();
            this.drawToolbar.create('polyline',
                {
                    mode: 'freehand'
                });
            this.drawModeTextNode.innerText = this.i18n.labels.freehandPolyline;
        },
        drawPolygon: function () {
            this.disconnectMapViewClick();
            this.drawToolbar.create('polygon',
                {
                    mode: 'click'
                });
            this.drawModeTextNode.innerText = this.i18n.labels.polygon;
        },
        drawFreehandPolygon: function () {
            this.disconnectMapViewClick();
            this.drawToolbar.create('polygon',
                {
                    mode: 'freehand'
                });
            this.drawModeTextNode.innerText = this.i18n.labels.freehandPolygon;
        },
        disconnectMapViewClick: function () {
            topic.publish('mapViewClickMode/setCurrent', 'draw');
            this.enableStopButtons();
        // dojo.disconnect(this.mapClickEventHandle);
        // this.mapClickEventHandle = null;
        },
        connectMapViewClick: function () {
            topic.publish('mapViewClickMode/setDefault');
            this.disableStopButtons();
        // if (this.mapClickEventHandle === null) {
        //     this.mapClickEventHandle = dojo.connect(this.map, 'onClick', this.mapClickEventListener);
        // }
        },
        onDrawToolbarDrawEnd: function (evt) {
            this.drawToolbar.deactivate();
            this.drawModeTextNode.innerText = this.i18n.labels.currentDrawModeNone;
            var graphic = null;
            switch (evt.geometry.type) {
            case 'point':
                graphic = new Graphic(evt.geometry);
                this.pointGraphics.add(graphic);
                break;
            case 'polyline':
                graphic = new Graphic(evt.geometry);
                this.polylineGraphics.add(graphic);
                break;
            case 'polygon':
                graphic = new Graphic(evt.geometry, null, {
                    ren: 1
                });
                this.polygonGraphics.add(graphic);
                break;
            default:
            }
            this.connectMapViewClick();
        },
        clearGraphics: function () {
            this.endDrawing();
            this.connectMapViewClick();
            this.drawModeTextNode.innerText = 'None';
        },
        stopDrawing: function () {
           // this.drawToolbar.deactivate();
            this.drawToolbar.delete();

            this.drawModeTextNode.innerText = 'None';
            this.connectMapViewClick();
        },
        endDrawing: function () {
            this.pointGraphics.removeAll();
            this.polylineGraphics.removeAll();
            this.polygonGraphics.removeAll();
           // this.drawToolbar.deactivate();

            this.drawToolbar.delete();
            this.disableStopButtons();
        },
        disableStopButtons: function () {
            this.stopDrawingButton.set('disabled', true);
            this.eraseDrawingButton.set('disabled', !this.noGraphics());
        },
        enableStopButtons: function () {
            this.stopDrawingButton.set('disabled', false);
            this.eraseDrawingButton.set('disabled', !this.noGraphics());
        },
        noGraphics: function () {

            if (this.pointGraphics.graphics.length > 0) {
                return true;
            } else if (this.polylineGraphics.graphics.length > 0) {
                return true;
            } else if (this.polygonGraphics.graphics.length > 0) {
                return true;
            }
            return false;
        },
        onLayoutChange: function (open) {
            // end drawing on close of title pane
            if (!open) {
                //this.endDrawing();
                if (this.mapViewClickMode === 'draw') {
                    topic.publish('mapViewClickMode/setDefault');
                }
            }
        },
        setMapViewClickMode: function (mode) {
            this.mapViewClickMode = mode;
        }
    });
});
define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dojo/_base/Color',

    'esri/widgets/Measurement',   
    'dojo/text!./Measurement/templates/Measurement.html',

    'dojo/topic',
    'dojo/aspect',
    'dojo/i18n!./Measurement/nls/resource',

    'dijit/form/Button',
    'xstyle/css!./Measurement/css/Measurement.css',
    'xstyle/css!./Measurement/css/adw-icons.css'
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    lang,
    Color,

    Measurement,
    measureTemplate,

    topic,
    aspect,
    i18n

) {

    // main draw dijit
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,  
        templateString: measureTemplate,
        i18n: i18n,
        drawToolbar: null,
        mapViewClickMode: null,
        postCreate: function () {
            this.inherited(arguments);  

            this.measurementToolbar = new Measurement(
                {
                    view: this.view,
                    defaultAreaUnit: this.defaultAreaUnit,
                    defaultLengthUnit: this.defaultLengthUnit
                }
            );

            this.own(topic.subscribe('mapViewClickMode/currentSet', lang.hitch(this, 'setMapViewClickMode')));
            if (this.parentWidget && this.parentWidget.toggleable) {
                this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function () {
                    this.onLayoutChange(this.parentWidget.open);
                })));
            }
        },
      
        measureLine: function () {
            this.measurementToolbar.activeTool = "distance";
            this.checkMeasureTool();
        },
        measureArea: function () {
            this.measurementToolbar.activeTool = "area";
            this.checkMeasureTool();
        },
        measureDelete: function () {
            this.measurementToolbar.clear();
            this.checkMeasureTool();
        },

        checkMeasureTool: function () {
            // no measurement tool is active
            if (!this.measurementToolbar.activeTool || this.measurementToolbar.activeTool === '') {
                if (this.mapViewClickMode === 'measure') {
                    this.connectMapViewClick();
                }
                // a measurement tool is active
            } else if (this.mapViewClickMode !== 'measure') {
                this.disconnectMapViewClick();

            }
        },

        disconnectMapViewClick: function () {
            topic.publish('mapViewClickMode/setCurrent', 'measure');
        //    this.enableStopButtons();
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
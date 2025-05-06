define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',

    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom-style',
    'dojo/topic',

    'put-selector/put'

], function (
    declare,
    _WidgetBase,

    lang,
    on,
    domStyle,
    topic,

    put
) {

    return declare([_WidgetBase], {

        className: 'fas fa-spinner fa-spin',
        style: 'color:#333;text-shadow:2px 2px #eee;font-size:32px;display:none;position:absolute;top:calc(50% - 16px);left:calc(50% - 16px);z-index:999',
        textStyle: 'color:#333;text-shadow:2px 2px #eee;font-size:32px;display:none;position:absolute;top:calc(50% - 16px);left:calc(50% + 20px);z-index:999',
        theText: '',

        postCreate: function () {
            this.inherited(arguments);

            var view = this.params.view;

            this.loading = put(view.container, 'i', {
                className: this.className,
                style: this.style
            });

            this.theText = this.msgText || {};
            if (this.theText.length > 0) {
                this.loadingText = put(view.container, 'i', {
                    className: '',
                    style: this.textStyle,
                    textContent: this.theText
                });
            }

            this.view.watch('stationary', (stationary) => {
                this.setLoading(stationary === false);
            })

            topic.subscribe('showLoading/showLoading', lang.hitch(this, 'showLoading'));
            topic.subscribe('showLoading/hideLoading', lang.hitch(this, 'hideLoading'));
        },

        setLoading: function (updating) {
            if (updating) {
                this.showLoading();
            } else {
                this.hideLoading();
            }
        },

        showLoading: function (view) {
            //domStyle.set(this.loading, 'display', 'block');
            //if (this.theText.length > 0) {
            //    domStyle.set(this.loadingText, 'display', 'block');
            //}
            //this.map.disableMapNavigation();
            //this.map.hideZoomSlider();
            
            domStyle.set(this.loading, 'display', 'block');
            if (this.theText.length > 0) {
                domStyle.set(this.loadingText, 'display', 'block');
            }

            this.view.navigation.browserTouchPanEnabled = false;
            this.view.navigation.momentumEnabled = false;
            this.view.navigation.mouseWheelZoomEnabled = false;

/*

            view.ui.add("zoom");

            // Removes the zoom action on the popup
            view.popup.actions = [];

            // stops propagation of default behavior when an event fires
            function stopEvtPropagation(event) {
                event.stopPropagation();
            }

            // disable mouse wheel scroll zooming on the view
            view.on("mouse-wheel", stopEvtPropagation);

            // disable zooming via double-click on the view
            view.on("double-click", stopEvtPropagation);

            // disable zooming out via double-click + Control on the view
            view.on("double-click", ["Control"], stopEvtPropagation);

            // disables pinch-zoom and panning on the view
            view.on("drag", stopEvtPropagation);

            // disable the view's zoom box to prevent the Shift + drag
            // and Shift + Control + drag zoom gestures.
            view.on("drag", ["Shift"], stopEvtPropagation);
            view.on("drag", ["Shift", "Control"], stopEvtPropagation);

            // prevents zooming with the + and - keys
            view.on("key-down", (event) => {
                const prohibitedKeys = ["+", "-", "Shift", "_", "=", "ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"];
                const keyPressed = event.key;
                if (prohibitedKeys.indexOf(keyPressed) !== -1) {
                    event.stopPropagation();
                }
            });
            */

        },

        hideLoading: function (view) {
            //domStyle.set(this.loading, 'display', 'none');
            //if (this.theText.length > 0) {
            //    domStyle.set(this.loadingText, 'display', 'none');
            //}
            //this.map.enableMapNavigation();
            //this.map.showZoomSlider();
            
            domStyle.set(this.loading, 'display', 'none');
            if (this.theText.length > 0) {
                domStyle.set(this.loadingText, 'display', 'none');
            }

            this.view.navigation.browserTouchPanEnabled = true;
            this.view.navigation.momentumEnabled = true;
            this.view.navigation.mouseWheelZoomEnabled = true;
/*
            view.ui.remove("zoom");

            // Removes the zoom action on the popup
            view.popup.actions = [];

            // stops propagation of default behavior when an event fires
            function startEvtPropagation(event) {
                event.startPropagation();
            }

            // disable mouse wheel scroll zooming on the view
            view.on("mouse-wheel", startEvtPropagation);

            // disable zooming via double-click on the view
            view.on("double-click", startEvtPropagation);

            // disable zooming out via double-click + Control on the view
            view.on("double-click", ["Control"], startEvtPropagation);

            // disables pinch-zoom and panning on the view
            view.on("drag", startEvtPropagation);

            // disable the view's zoom box to prevent the Shift + drag
            // and Shift + Control + drag zoom gestures.
            view.on("drag", ["Shift"], startEvtPropagation);
            view.on("drag", ["Shift", "Control"], startEvtPropagation);

            // prevents zooming with the + and - keys
            view.on("key-down", (event) => {
                const prohibitedKeys = ["+", "-", "Shift", "_", "=", "ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"];
                const keyPressed = event.key;
                if (prohibitedKeys.indexOf(keyPressed) !== -1) {
                    event.startPropagation();
                }
            });
            */
            
        }
    });
});

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/aspect',
    'dojo/topic',
    'dojo/query',
    'dojo/dom-construct',
    'dojo/dom-attr',
    'dijit/registry',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_Contained',
    'dijit/MenuItem',
    'dijit/MenuSeparator',
    './_Control', // layer control base class
    './_DynamicSublayer',
    './_DynamicFolder',
    './../plugins/legendUtil',
    'dojo/i18n!./../nls/resource'
], function (
    declare,
    lang,
    array,
    aspect,
    topic,
    query,
    domConst,
    domAttr,
    registry,
    _WidgetBase,
    _TemplatedMixin,
    _Contained,
    MenuItem,
    MenuSeparator,
    _Control, // most everything happens here
    DynamicSublayer,
    DynamicFolder,
    legendUtil,
    i18n
) {

    var DynamicControl = declare([_WidgetBase, _TemplatedMixin, _Contained, _Control], {
        _layerType: 'overlay', // constant
        _esriLayerType: 'dynamic', // constant
        _sublayerControls: [], // sublayer controls
        _folderControls: [], // folder controls
        _hasSublayers: false, // true when sublayers created
        _visLayersHandler: null,
        constructor: function () {
            this._sublayerControls = [];
            this._folderControls = [];
        },
        _layerTypePreInit: function () {
            //if (this.layer.layerInfos.length > 1 && this.controlOptions.sublayers) {
            if (this.layer.sublayers && this.layer.sublayers.length > 1 && this.controlOptions.sublayers) {
                // we have sublayer controls
                this._hasSublayers = true;
                this._visLayersHandler = aspect.after(this.layer, 'setVisibleLayers', lang.hitch(this, '_onSetVisibleLayers'), true);
            }
        },
        // create sublayers and legend
        _layerTypeInit: function () {
            var isLegend = legendUtil.isLegend(this.controlOptions.noLegend, this.controller.noLegend);
            if (isLegend && this.controlOptions.sublayers === true) {
                this._expandClick();
                this._createControls(this.layer);
                aspect.after(this, '_createControls', lang.hitch(this, legendUtil.dynamicSublayerLegend(this.layer, this.expandNode)));
            } else if (this.controlOptions.sublayers === false && isLegend) {
                this._expandClick();
                legendUtil.layerLegend(this.layer, this.expandNode);
            } else if (this.controlOptions.sublayers === true && !isLegend) {
                this._expandClick();
                aspect.after(this, '_createControls', lang.hitch(this, '_removeSublayerLegends'));
                this._createControls(this.layer);
            } else {
                this._expandRemove();
            }
        },
        // called from LayerMenu plugin
        _dynamicToggleMenuItems: function (menu) {
            if (this._hasSublayers && this.controlOptions.allSublayerToggles !== false) {
                menu.addChild(new MenuItem({
                    label: i18n.dynamicSublayersOn,
                    iconClass: 'far fa-fw fa-check-square',
                    onClick: lang.hitch(this, '_toggleAllSublayers', true)
                }));
                menu.addChild(new MenuItem({
                    label: i18n.dynamicSublayersOff,
                    iconClass: 'far fa-fw fa-square',
                    onClick: lang.hitch(this, '_toggleAllSublayers', false)
                }));
                menu.addChild(new MenuSeparator());
            }
        },
        _initCustomMenu: function () {
            // add custom sublayer menu items if we only have one sublayer
            if (!this._hasSublayers) {
                array.forEach(this.controlOptions.subLayerMenu, lang.hitch(this, '_addCustomMenuItem', this.layerMenu));
                this.layerMenu.addChild(new MenuSeparator());
            }
        },
        // toggle all sublayers on/off
        _toggleAllSublayers: function (state) {
            array.forEach(this._sublayerControls, function (control) {
                control._setSublayerCheckbox(state);
            });
            this._setVisibleLayers();
        },
        // add folder/sublayer controls per layer.layerInfos
        _createControls: function (layer) {
            var alllayers = layer.allSublayers;
            if (alllayers && alllayers.length > 0) {
                var count = alllayers.length;

                for (i = 0; i < count; i++) {
                    var l = alllayers.items[i];
                    this._createControl(layer, l);
                }
            }

            if (this.controlOptions.ignoreDynamicGroupVisibility) {
                array.forEach(this._folderControls, function (control) {
                    control._checkFolderVisibility();
                });
            }
        },
     
        _createControl: function (layer, info) {
            // see if there was any override needed from the subLayerInfos array in the controlOptions
            var sublayerInfo = array.filter(this.controlOptions.subLayerInfos, function (sli) {
                return sli.id === info.id;
            }).shift();
            lang.mixin(info, sublayerInfo);            

            if (info.sublayers && info.sublayers.length > 0) {
                this._createDynamicFolder(info, layer);
            }
            else {
                this._createDynamicSubLayer(info, layer);
            }    
        },      

        _createDynamicSubLayer: function (info, layer) {            
            var pid = Number(info.parent.id);
            if (isNaN(pid)) {
                pid = -1;
            }

            var controlId = layer.id + '-' + info.id + '-sublayer-control',
                //pid = info.parentLayerId,
                parent = null,
                control = new DynamicSublayer({
                    id: controlId,
                    control: this,
                    sublayerInfo: info,
                    icons: this.icons
                });

            if (pid === -1) {
                parent = this.expandNode;
            } else {
                parent = registry.byId(layer.id + '-' + pid + '-sublayer-control').expandNode;
            }

            if (parent) {
                domConst.place(control.domNode, parent, 'first');  // 'last');
                control.startup();
                this._sublayerControls.push(control);
            }
        },

        _createDynamicFolder: function (info, layer) {
            var pid = Number(info.parent.id);
            if (isNaN(pid)) {
                pid = -1;
            }

            var controlId = layer.id + '-' + info.id + '-sublayer-control',
                //pid = info.parentLayerId,
                parent = null,
                control = new DynamicFolder({
                    id: controlId,
                    control: this,
                    sublayerInfo: info,
                    icons: this.icons
                });

            if (pid === -1) {
                parent = this.expandNode;
            } else {
                parent = registry.byId(layer.id + '-' + pid + '-sublayer-control').expandNode;
            }

            if (parent) {
                domConst.place(control.domNode, parent, 'first');  // 'last');
                control.startup();
                this._folderControls.push(control);
            }
        },

        // simply remove expandClickNode
        _removeSublayerLegends: function () {
            array.forEach(this._sublayerControls, function (control) {
                if (!control.sublayerInfo.subLayerIds) {
                    domConst.destroy(control.expandClickNode);
                }
            });
        },

        // set dynamic layer visible layers
        _setVisibleLayers: function () {
            // remove aspect handler
            this._visLayersHandler.remove();
            var layer = this.layer,
                visibleLayers = [],
                allVisibleLayers = [],
                ignoreDynamicGroupVisibility = this.controlOptions.ignoreDynamicGroupVisibility;

            // get visibility of sub layers not in folders
            array.forEach(this._sublayerControls, function (subLayer) {
                /*var pid = Number(subLayer.parentLayerId);
                if (isNaN(pid)) {
                    pid = -1;
                }*/

                if (subLayer._isVisible() && subLayer.parentLayerId === -1) {
                    visibleLayers.push(subLayer.sublayerInfo.id);
                    allVisibleLayers.push(subLayer.sublayerInfo.id);
                }
            });

            // get visibility of folders
            array.forEach(this._folderControls, lang.hitch(this, function (folder) {
                if (folder._isVisible() || (ignoreDynamicGroupVisibility && folder._hasAnyVisibleLayer())) {
                    allVisibleLayers.push(folder.sublayerInfo.id);
                }
            }));

            // get visibility of sub layers that are contained within a folder
            array.forEach(this._folderControls, lang.hitch(this, function (folder) {
                var subLayers = folder._getSubLayerControls();
                array.forEach(subLayers, lang.hitch(this, function (subLayer) {
                    if (subLayer._isVisible()) {
                        allVisibleLayers.push(subLayer.sublayerInfo.id);
                        if (ignoreDynamicGroupVisibility) {
                            visibleLayers.push(subLayer.sublayerInfo.id);
                            return;
                        }
                    }
                    var currentLayer = subLayer;
                    var oldLayer = null;
                    function checkParent(f) {
                        if (f.sublayerInfo.id === currentLayer.sublayerInfo.parentLayerId) {
                            currentLayer = f;
                        }
                    }
                    while (currentLayer._isVisible() && currentLayer.sublayerInfo.parentLayerId !== -1 && oldLayer !== currentLayer) {
                        oldLayer = currentLayer;
                        array.forEach(this._folderControls, checkParent);
                    }
                    if (currentLayer._isVisible()) {
                        visibleLayers.push(subLayer.sublayerInfo.id);
                    }
                }));
            }));

            if (!visibleLayers.length) {
                visibleLayers.push(-1);
            }
            if (ignoreDynamicGroupVisibility) {
                array.forEach(this._folderControls, function (control) {
                    control._checkFolderVisibility();
                });
            }

            //this._setVisibleLayers(this, layer, visibleLayers);

            this._setVisibleSubLayers(visibleLayers);

            //layer.refresh();

            topic.publish('layerControl/setVisibleLayers', {
                id: layer.id,
                visibleLayers: visibleLayers
            });

            topic.publish('layerControl/setAllVisibleLayers', {
                id: layer.id,
                allVisibleLayers: allVisibleLayers
            });

            // set aspect handler
            this._visLayersHandler = aspect.after(this.layer, 'setVisibleLayers', lang.hitch(this, '_onSetVisibleLayers'), true);
        },

        /*setVisibleLayers: function (control, layer, visibleLayers) {
            if (layer && visibleLayers && visibleLayers.length > 0) {
                if (layer.sublayers && layer.sublayers.length > 0) {
                    array.forEach(layer.sublayers.items, function (sl) {
                        if (!(sl.sublayers && sl.sublayers.length > 0)) {
                            var id = sl.id;
                            var index = visibleLayers.indexOf(id);
                            sl.visible = index >= 0;
                        } else {
                            var id = sl.id;
                            var index = visibleLayers.indexOf(id);
                            sl.visible = index >= 0;


                            control._setVisibleSubLayers(control, sl, visibleLayers);
                        }
                    })
                }
            }
        },*/
        _setVisibleSubLayers: function (visibleLayers) {
            array.forEach(this.layer.allSublayers.items, function (sb) {
                sb.visible = false;
            })            

            if (visibleLayers && visibleLayers.length > 0) {
                var count = visibleLayers.length;

                for (i = 0; i < count; i++) {
                    var vl = visibleLayers[i];
                    var l = this.layer.findSublayerById(vl);
                    if (l) {
                        l.visible = true;

                        var pid = Number(l.parent.id);
                        if (!isNaN(pid) && pid >=0) {
                            l.parent.visible = true;

                            pid = Number(l.parent.parent.id);
                            if (!isNaN(pid) && pid >= 0) {
                                l.parent.parent.visible = true;
                            }
                        }
                    }
                }
            }
        },

        _onSetVisibleLayers: function (visLayers, noPublish) {
            // set the sub layer visibility first
            array.forEach(this._sublayerControls, function (control) {
                var viz = (array.indexOf(visLayers, control.sublayerInfo.id) !== -1);
                control._setSublayerCheckbox(viz, null, noPublish);
            });

            // setting the folder (group layer) visibility will change
            // visibility for all children sub layer and folders
            array.forEach(this._folderControls, function (control) {
                var viz = (array.indexOf(visLayers, control.sublayerInfo.id) !== -1);
                control._setFolderCheckbox(viz, null, noPublish);
            });

            if (this.controlOptions.ignoreDynamicGroupVisibility) {
                // finally, set the folder UI (state of checkbox) based on
                // the sub layers and folders within the parent folder
                array.forEach(this._folderControls, function (control) {
                    control._checkFolderVisibility();
                });
            }
        }
    });
    return DynamicControl;
});
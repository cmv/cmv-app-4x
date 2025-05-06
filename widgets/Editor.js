define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/topic',
    'dojo/aspect',
    'dojo/text!./Editor/templates/Editor.html',
    'dojo/i18n!./Editor/nls/resource',

    'dijit/form/Button'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domConstruct, topic, aspect, template, i18n) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        i18n: i18n,
        widgetsInTemplate: true,
        editor: null,
        isEdit: false,
        mapViewClickMode: null,
        postCreate: function () {
            this.inherited(arguments);
            this.own(topic.subscribe('mapViewClickMode/currentSet', lang.hitch(this, 'setMapViewClickMode')));
            if (this.parentWidget && this.parentWidget.toggleable) {
                this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function () {
                    this.onLayoutChange(this.parentWidget.open);
                })));
            }
        },
        toggleEditing: function () {
            if (!this.isEdit) {
                var ops = lang.clone(this.settings);
                ops.view = this.view;
                ops.layerInfos = this.layerInfos;

                var con = domConstruct.create('div', {
                    innerHTML: '<img style="display:inline;" src="data:image/gif;base64,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"/>',
                    'style': 'text-align:center;'
                }, this.containerNode, 'only');

                require(['esri/widgets/Editor'], lang.hitch(this, function (Editor) {
                    this.editor = new Editor({
                        view: ops.view
                    }, con);
                    //this.editor.startup();

                    // Get the configuration from header
                    var req = new XMLHttpRequest();
                    req.open('GET', document.location, false);
                    req.send(null);
                    var myHeader = req.getResponseHeader('my_header_username');

                    this.editor.on('sketch-update', function (evt) {
                        if (evt.detail.state == 'complete' && evt.detail.graphics && evt.detail.graphics.length > 0) {
                            for (var s = 0; s < evt.detail.graphics.length; s++) {
                                var editFeature = evt.detail.graphics[s];
                                //this.updateFeature(g, myHeader);

                                var layerid = evt.layer.id;

                                // Gestion des diff rentes couches
                                if (layerid == 'DECI_(Fournisseurs)') {
                                    editFeature.attributes.editeur_sig = myHeader;
                                    editFeature.attributes.date_maj_sdis = Date.now();
                                } else if (layerid == 'DECI_(ETAT_TEMPORAIRE)') {
                                    editFeature.attributes.nom_util_sig = myHeader;
                                } else if (layerid == 'PostIt') {
                                    editFeature.attributes.nom_util_sig = myHeader;
                                    editFeature.attributes.web_sig = 'O';
                                }
                            }
                        }
                    });
                })); 

                this.toggleBTN.set('label', this.i18n.labels.stopEditing);
                this.toggleBTN.set('class', 'danger');
                this.isEdit = true;
                topic.publish('mapViewClickMode/setCurrent', 'editor');

                con.innerHTML = '';
            } else {
                this.endEditing();
                topic.publish('mapViewClickMode/setDefault');
            }
        },
        endEditing: function () {
            //if (this.editor && this.editor.destroyRecursive) {
            if (this.editor) {
                this.editor.destroy();
            }

            this.toggleBTN.set('label', this.i18n.labels.startEditing);
            this.toggleBTN.set('class', 'success');
            this.isEdit = false;
            this.editor = null;
        },

        onLayoutChange: function (open) {
            // end edit on close of title pane
            if (!open && this.mapViewClickMode === 'editor') {
                this.endEditing();
                topic.publish('mapViewClickMode/setDefault');
            }
        },
        setMapViewClickMode: function (mode) {
            this.mapViewClickMode = mode;
            if (mode !== 'editor') {
                this.endEditing();
            }
        }
    });
});
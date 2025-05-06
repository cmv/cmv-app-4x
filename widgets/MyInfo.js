define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/dom-construct',

    'dojo/text!./MyInfo/templates/MyInfo.html',

    'dijit/layout/ContentPane',

    'xstyle/css!./MyInfo/css/MyInfo.css'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, domConstruct, template) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        href: null,
        widgetsInTemplate: true,
        templateString: template,
        content: '',
        baseClass: 'cmvMyInfoWidget',

        postCreate: function () {
            this.inherited(arguments);
            this.initialize();

        },

        initialize: function () {
            if (this.params.href) {
                this.myInfoNode.set('href', this.params.href);
                domConstruct.place(this.myInfoNode.domNode, this.params.attachTo, this.position);
            } else if (this.params.content) {
                domConstruct.place(this.params.content, this.params.attachTo, this.position);
            } else {
                console.log('No href or content param specified!'); // eslint-disable-line
            }

        }
    });
});
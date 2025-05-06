define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',

    'dojo/_base/lang',
    'dojo/on',
    'dojo/_base/array',

    'dijit/MenuItem',

    'esri/rest/locator',
    'esri/Graphic',
    'esri/symbols/PictureMarkerSymbol',
    'esri/PopupTemplate',
   // 'esri/layers/GraphicsLayer',

    'dojo/i18n!./ReverseGeocoder/nls/resource'

], function (
    declare,
    _WidgetBase,

    lang,
    on,
    array,

    MenuItem,

    locator,
    Graphic,
    PictureMarkerSymbol,
    PopupTemplate,
   // GraphicsLayer,

    i18n
) {

    return declare([_WidgetBase], {
        i18n: i18n,
        url: 'https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer',
        distance: 1000,

        title: "Adresse &agrave; l'emplacement",

        reverseGeocodeTemplate: [
            '<table class="attrTable">',
            '<tr valign="top">', '<td class="attrName">${i18n.labels.address}</td>', '<td class="attrValue">${Address}</td>', '</tr>',
            '<tr valign="top">', '<td class="attrName">${i18n.labels.neighborhood}</td>', '<td class="attrValue">${Neighborhood}</td>', '</tr>',
            '<tr valign="top">', '<td class="attrName">${i18n.labels.city}</td>', '<td class="attrValue">${City}</td>', '</tr>',
            '<tr valign="top">', '<td class="attrName">${i18n.labels.subregion}</td>', '<td class="attrValue">${Subregion}</td>', '</tr>',
            '<tr valign="top">', '<td class="attrName">${i18n.labels.region}</td>', '<td class="attrValue">${Region}</td>', '</tr>',
            '<tr valign="top">', '<td class="attrName">${i18n.labels.postalCode}</td>', '<td class="attrValue">${Postal}&nbsp;${PostalExt}</td>', '</tr>',
            '<tr valign="top">', '<td class="attrName">${i18n.labels.countryCode}</td>', '<td class="attrValue">${CountryCode}</td>', '</tr>',
            '</table>'
        ].join(''),

       /* symbol: new PictureMarkerSymbol({
            angle: 20,
            xoffset: 6,
            yoffset: 9,
           // type: 'esriPMS',
            url: 'https://static.arcgis.com/images/Symbols/Basic/RedFlag.png',
            contentType: 'image/png',
            width: 18,
            height: 18
        }),*/

        postCreate: function () {
            this.inherited(arguments);
            //this.locator = new Locator(this.url);

            array.forEach(Object.keys(this.i18n.labels), lang.hitch(this, function (key) {
                this.reverseGeocodeTemplate = this.reverseGeocodeTemplate.replace('${i18n.labels.' + key + '}', this.i18n.labels[key]);
            }));

            //this.map.on('MouseDown', lang.hitch(this, function (evt) {
            //    this.mapRightClickPoint = evt.mapPoint;
            //}));
            this.view.on('click', lang.hitch(this, function (evt) {
                if (evt.button == 2) {
                    this.mapViewRightClickPoint = evt.mapPoint;
                }
            }));

            this.mapViewRightClickMenu.addChild(new MenuItem({
                label: this.i18n.labels.getAddressHere,
                onClick: lang.hitch(this, 'reverseGeocode')
            }));

            this.infoTemplate = new PopupTemplate(this.title, this.reverseGeocodeTemplate);
           /* this.graphics = new GraphicsLayer({
                id: 'reverseGeocodeGraphics'
            });
            this.view.map.add(this.graphics);*/
        },
        reverseGeocode: function () {
            //this.locator.locationToAddress(this.mapViewRightClickPoint, this.distance, lang.hitch(this, 'reverseGeocodeComplete'));

            this.view.popup.visible = false;

            const params = {
                location: this.mapViewRightClickPoint
            };

            // Execute a reverse geocode using the clicked location
            locator
                .locationToAddress(this.url, params)
                .then((response) => {
                    // If an address is successfully found, show it in the popup's content
                    //this.reverseGeocodeComplete(response);


                    this.view.popup.content = response.address;
                    this.view.popup.title = this.title;
                    //this.view.popup.content = graphic.attributes;
                    //this.view.popup.features = [graphic];
                    this.view.popup.location = response.location;

                    this.view.openPopup();
                })
                /*.catch(() => {
                    // If the promise fails and no result is found, show a generic message
                    view.popup.content = "No address was found for this location";
                });*/
        },
        //reverseGeocodeComplete: function (res) {
        //    var graphic = new Graphic(res.location, this.symbol, res.address, this.infoTemplate);
        //    this.graphics.removeAll();
        //    this.graphics.add(graphic);

        //    //this.highlight = this.map.infoWindow.get('highlight');          

        //    //this.map.infoWindow.clearFeatures();
        //    //this.map.infoWindow.setTitle(this.title);
        //    //this.map.infoWindow.setContent(graphic.getContent());
        //    //this.map.infoWindow.setFeatures([graphic]);
        //    //this.map.infoWindow.set('highlight', false);

            
        //    //this.view.popup = this.infoTemplate;
        //    this.view.popup.title = this.title;
        //    this.view.popup.content = graphic.attributes;
        //    this.view.popup.features = [graphic];
        //    this.view.popup.location = res.location;

        //    //var screenPnt = this.map.toScreen(res.location);
        //    //this.map.infoWindow.show(screenPnt, this.map.getInfoWindowAnchor(screenPnt));

        //    this.view.openPopup();

          

        //   /* on.once(this.view.popup, 'hide', lang.hitch(this, function () {
        //        this.graphics.clear();
        //        this.map.infoWindow.clearFeatures();
        //        this.map.infoWindow.set('highlight', this.highlight);
        //    }));*/
        //}
    });
});
define([
    'dojo/i18n!./nls/main',
    'dojo/_base/lang',
    'dojo/number'
], function (i18n, lang, number) {

    var linkTemplate = '<a href="{url}" target="_blank">{text}</a>';
    function directionsFormatter (noValue, attributes) {
        return lang.replace(linkTemplate, {
            url: 'https://www.google.com/maps/dir/' + attributes.Address + ' Louisville, KY',
            text: 'Get Directions'
        });
    }

    return {
        view: true,
        mapViewClickMode: true,
        mapViewRightClickMenu: false,
        identifyLayerInfos: true,
        identifyTolerance: 10, //5,
        identifyLayerOption: 'visible',     // 'top'  'visible'  'all'  'popup'
        draggable: false,
        returnFieldName: false,
        returnUnformattedValues: false,

        // config object definition:
        //  {<layer id>:{
        //      <sub layer number>:{
        //          <pop-up definition, see link below>
        //          }
        //      },
        //  <layer id>:{
        //      <sub layer number>:{
        //          <pop-up definition, see link below>
        //          }
        //      }
        //  }

        // for details on pop-up definition see: https://developers.arcgis.com/javascript/jshelp/intro_popuptemplate.html

        identifies: {
            cities: {
                0: {
                    fieldInfos: [{
                        visible: true,
                        fieldName: 'CITY_NAME',
                        label: 'Name'
                    }, {
                        visible: true,
                        fieldName: 'POP',
                        label: 'Population',
                        formatter: function (value) {
                            return number.format(value);
                        }
                    }]
                }
            },
            damageAssessment: {
                0: {
                    fieldInfos: [
                        {
                            fieldName: 'primcause',
                            visible: true,
                            label: 'Cause',
                            formatter: function (value) {
                                return (value.toLowerCase() !== 'null') ? value : 'Unknown';
                            }
                        },
                        {
                            fieldName: 'typdamage',
                            visible: true,
                            label: 'Extent'
                        }
                    ]
                }
            },
            louisvillePubSafety: {
                2: {
                    title: i18n.identify.louisvillePubSafety.policeStation,
                    fieldInfos: [
                        {
                            // example of adding a 'calculated' or formatted field
                            // click on a louisville kentucky police station to see
                            // the result
                            fieldName: 'Directions',
                            visible: true,
                            formatter: directionsFormatter,
                            useExpression: false
                        }, {
                            fieldName: 'Name',
                            visible: true
                        }, {
                            fieldName: 'Address',
                            visible: true
                        }, {
                            fieldName: 'Type',
                            visible: true
                        }, {
                            fieldName: 'Police Function',
                            visible: true
                        }, {
                            fieldName: 'Last Update Date',
                            visible: true
                        }
                    ]
                },
                8: {
                    title: i18n.identify.louisvillePubSafety.trafficCamera,
                    description: '{Description} lasted updated: {Last Update Date}',
                    mediaInfos: [
                        {
                            title: '',
                            caption: '',
                            type: 'image',
                            value: {
                                sourceURL: '{Location URL}',
                                linkURL: '{Location URL}'
                            }
                        }
                    ]
                }
            }
        }
    };
});

define([
    'esri/core/units',
    'esri/geometry/Extent',
    'esri/config',
    /*'esri/urlUtils',*/
    'esri/rest/geometryService',
    'esri/rest/support/ImageParameters',
    'gis/plugins/Google',
    'dojo/i18n!./nls/main',
    'dojo/topic',
    'dojo/sniff'
], function (units, Extent, esriConfig, /*urlUtils,*/ GeometryService, ImageParameters, GoogleMapsLoader, i18n, topic, has) {

    // url to your proxy page, must be on same machine hosting you app. See proxy folder for readme.
    //esriConfig.defaults.io.proxyUrl = 'proxy/proxy.ashx';
    //esriConfig.defaults.io.alwaysUseProxy = false;

    // add a proxy rule to force specific domain requests through proxy
    // be sure the domain is added in proxy.config
    /*urlUtils.addProxyRule({
        urlPrefix: 'www.example.com',
        proxyUrl: 'proxy/proxy.ashx'
    });*/

    // url to your geometry server.
    esriConfig.geometryServiceUrl = 'https://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer';

    //esriConfig.io.corsEnabledServers.push('api.what3words.com');

    // Use your own Google Maps API Key.
    // https://developers.google.com/maps/documentation/javascript/get-api-key
    GoogleMapsLoader.KEY = GoogleMapsLoader.KEY || 'NOT-A-REAL-API-KEY';

    // helper function returning ImageParameters for dynamic layers
    // example:
    // imageParameters: buildImageParameters({
    //     layerIds: [0],
    //     layerOption: 'show'
    // })
    function buildImageParameters (config) {
        config = config || {};
        var ip = new ImageParameters();
        //image parameters for dynamic services, set to png32 for higher quality exports
        ip.format = 'png32';
        for (var key in config) {
            if (config.hasOwnProperty(key)) {
                ip[key] = config[key];
            }
        }
        return ip;
    }

    //some example topics for listening to menu item clicks
    //these topics publish a simple message to the growler
    //in a real world example, these topics would be used
    //in their own widget to listen for layer menu click events
    topic.subscribe('layerControl/hello', function (event) {
        topic.publish('growler/growl', {
            title: 'Hello!',
            message: event.layer._titleForLegend + ' ' +
                (event.subLayer ? event.subLayer.name : '') +
                ' says hello'
        });
    });
    topic.subscribe('layerControl/goodbye', function (event) {
        topic.publish('growler/growl', {
            title: 'Goodbye!',
            message: event.layer._titleForLegend + ' ' +
                (event.subLayer ? event.subLayer.name : '') +
                ' says goodbye'
        });
    });

    // simple clustering example now. should be replaced with a layerControl plugin
    topic.subscribe('layerControl/toggleClustering', function (event) {
        var layer = event.layer;
        if (layer.getFeatureReduction()) {
            if (layer.isFeatureReductionEnabled()) {
                layer.disableFeatureReduction();
            } else {
                layer.enableFeatureReduction();
            }
        }
    });

    return {
        // used for debugging your app
        isDebug: true,

        //default mapClick mode, mapClickMode lets widgets know what mode the map is in to avoid multipult map click actions from taking place (ie identify while drawing).
        defaultMapViewClickMode: 'identify',
        // map options, passed to map constructor. see: https://developers.arcgis.com/javascript/jsapi/map-amd.html#map1
        mapOptions: {
            basemap: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
            opacity: 0.7,
            sliderStyle: 'small',
            //spatialReference: { wkid: 2154 },
            spatialReferenceLocked: true
        },

        //webMapId: 'ef9c7fbda731474d98647bebb4b33c20',  // High Cost Mortgage
        // webMapOptions: {},

        // panes: {
        // 	left: {
        // 		splitter: true
        // 	},
        // 	right: {
        // 		id: 'sidebarRight',
        // 		placeAt: 'outer',
        // 		region: 'right',
        // 		splitter: true,
        // 		collapsible: true
        // 	},
        // 	bottom: {
        // 		id: 'sidebarBottom',
        // 		placeAt: 'outer',
        // 		splitter: true,
        // 		collapsible: true,
        // 		region: 'bottom'
        // 	},
        // 	top: {
        // 		id: 'sidebarTop',
        // 		placeAt: 'outer',
        // 		collapsible: true,
        // 		splitter: true,
        // 		region: 'top'
        // 	}
        // },
        // collapseButtonsPane: 'center', //center or outer

        // custom titles
        titles: {
            header: i18n.viewer.titles.header,
            subHeader: i18n.viewer.titles.subHeader,
            pageTitle: i18n.viewer.titles.pageTitle
        },

        layout: {
            /*  possible options for sidebar layout:
                    true - always use mobile sidebar, false - never use mobile sidebar,
                    'mobile' - use sidebar for phones and tablets, 'phone' - use sidebar for phones,
                    'touch' - use sidebar for all touch devices, 'tablet' - use sidebar for tablets only (not sure why you'd do this?),
                    other feature detection supported by dojo/sniff and dojo/has- http://dojotoolkit.org/reference-guide/1.10/dojo/sniff.html

                default value is 'phone'
            */
            //sidebar: 'phone'
        },

        panes: {
            left: {
                collapsible: true/*,
                style: 'display:none'*/
            },
            bottom: {
               id: 'sidebarBottom',
               placeAt: 'outer',
               splitter: true,
               collapsible: true,
               region: 'bottom',
	           open: 'none', // using false doesn't work
               style: 'height:200px;',
               content: '<div id="attributesContainer"></div>'
            }
        },
        collapseButtonsPane: 'center', //center or outer


        // user-defined layer types
        /*
        layerTypes: {
            myCustomLayer: 'widgets/MyCustomLayer'
        },
        */

        // user-defined widget types
        /*
        widgetTypes: [
            'myWidgetType'
        ],
        */

        // ignore the visibility of group layers in dynamic layers? default = true
        ignoreDynamicGroupVisibility: false,

        // operationalLayers: Array of Layers to load on top of the basemap: valid 'type' options: 'dynamic', 'tiled', 'feature'.
        // The 'options' object is passed as the layers options for constructor. Title will be used in the legend only. id's must be unique and have no spaces.
        // 3 'mode' options: MODE_SNAPSHOT = 0, MODE_ONDEMAND = 1, MODE_SELECTION = 2
        operationalLayers: [
            {
                // Les intercentions et engins
                type: 'dynamic',
                title: 'Louisville Public Safety',
                options: {
                    id: 'louisvillePubSafety',
                    url: 'https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/PublicSafety/PublicSafetyOperationalLayers/MapServer',
                    title: 'Louisville Public Safety',
                    opacity: 1.0,
                    visible: true,
                    //refreshInterval: 0.5,
                    outFields: ['*'],
                    imageParameters: buildImageParameters(),
                    mode: 0
                },
                legendLayerInfos: {
                    exclude: true
                },
                identifyLayerInfos: {
                    layerIds: [2, 4, 5, 8, 12, 21]
                },
                layerControlLayerInfos: {
                    swipe: true,
                    metadataUrl: true,
                    expanded: false
                }
            }, 	
            {
                type: 'feature',
                title: i18n.viewer.operationalLayers.sf311Incidents,
                options: {
                    id: 'sf311Incidents',
                    url: 'https://sampleserver6.arcgisonline.com/ArcGIS/rest/services/SF311/FeatureServer/0',
                    title: i18n.viewer.operationalLayers.sf311Incidents,
                    opacity: 1.0,
                    visible: false,
                    outFields: ['req_type', 'req_date', 'req_time', 'address', 'district'],
                    imageParameters: buildImageParameters(),
                    mode: 0
                },
                layerControlLayerInfos: {
                    layerGroup: 'Grouped Feature Layers',
                    menu: [{
                        topic: 'hello',
                        label: 'Say Hello Custom',
                        iconClass: 'far fa-fw fa-smile'
                    }]
                }
            },
            {
                type: 'dynamic',
                title: i18n.viewer.operationalLayers.louisvillePubSafety,
                options: {
                    id: 'louisvillePubSafety',
                    url: 'https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/PublicSafety/PublicSafetyOperationalLayers/MapServer',
                    title: i18n.viewer.operationalLayers.louisvillePubSafety,
                    opacity: 1.0,
                    visible: false,
                    outFields: ['*'],
                    imageParameters: buildImageParameters({
                        // include only sub layer ids.
                        // group layers omitted
                        layerIds: [2, 4, 5, 8, 12, 21],
                        layerOption: 'show'
                    }),
                    mode: 0
                },
                legendLayerInfos: {
                    layerInfo: {
                        hideLayers: [21]
                    }
                },
                identifyLayerInfos: {
                    layerIds: [2, 4, 5, 8, 12, 21]
                },
                layerControlLayerInfos: {
                    // group layers included to maintain folder hierarchy, not visibility.
                    layerIds: [0, 2, 4, 5, 8, 9, 10, 12, 21]
                }
            },
            {
                type: 'dynamic',
                title: i18n.viewer.operationalLayers.damageAssessment,
                options: {
                    id: i18n.viewer.operationalLayers.damageAssessment,
                    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/DamageAssessment/MapServer',
                    title: 'damageAssessment',
                    opacity: 1.0,
                    visible: false,
                    outFields: ['*'],
                    imageParameters: buildImageParameters(),
                    mode: 0
                },
                legendLayerInfos: {
                    returnFieldName: true
                },
                identifyLayerInfos: {
                    layerIds: [0, 1, 2, 3]
                },
                layerControlLayerInfos: {
                    swipe: true,
                    metadataUrl: true,
                    expanded: true,

                    //override the menu on this particular layer
                    subLayerMenu: [{
                        topic: 'hello',
                        label: 'Say Hello',
                        iconClass: 'far fa-fw fa-smile'
                    }]
                }
            },
            {
                type: 'dynamic',
                title: i18n.viewer.operationalLayers.cities,
                options: {
                    id: 'cities',
                    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer',
                    title: i18n.viewer.operationalLayers.cities,
                    opacity: 0.8,
                    visible: false
                }
            }
        ],
        // set include:true to load. For titlePane type set position the the desired order in the sidebar
        widgets: {
            growler: {
                include: true,
                id: 'growler',
                type: 'layout',
                path: 'widgets/Growler',
                placeAt: document.body,
                options: {
                    style: 'position:absolute;top:15px;' + (has('phone') ? 'left:50%;transform:translate(-50%,0);' : 'right:15px;')
                }
            },    
            scalebar: {
                include: true,
                id: 'scalebar',
                type: 'view',
                path: 'esri/widgets/ScaleBar',
                placeAt: 'bottom-right',
                position: '1',
                options: {
                    view: true,
                    unit: 'metric',
                    style: 'line'
                }
            }, 
            searchAdress: {
                include: true,
                expendable: true,
                collapse: has('phone'),
                id: 'searchAdress',
                type: 'view',
                path: 'esri/widgets/Search',
                title: i18n.viewer.widgets.search,
                iconClass: 'fas fa-search',
                placeAt: 'top-left',//has('phone') ? null : 'top-center',
                position: 0,
                options: 'config/search'
            },
            reverseGeocoder: {
                include: true,
                type: 'invisible',
                path: 'widgets/ReverseGeocoder',
                options: {
                    view: true,
                    mapViewRightClickMenu: true,
                }
            },
            exportDialog: {
                include: true,
                id: 'export',
                type: 'floating',
                path: 'widgets/Export',
                title: 'Exporter',
                preload: true,
                options: {}
            },
            homeButton: {
                include: true,
                id: 'homeButton',
                type: 'view',
                path: 'esri/widgets/Home',
                placeAt: 'top-left',
                position: 1,
                options: {
                    view: true,
                    extent: new Extent({
                        xmin: -180,
                        ymin: -85,
                        xmax: 180,
                        ymax: 85,
                        spatialReference: {
                            wkid: 4326
                        }
                    })
                }
            },
            locateButton: {
                include: true,
                id: 'locateButton',
                type: 'view',
                path: 'esri/widgets/Locate',
                placeAt: 'top-left',
                position: 2,
                options: {
                    view: true/*,
                    publishGPSPosition: true,
                    highlightLocation: true,
                    useTracking: true,
                    geolocationOptions: {
                        maximumAge: 0,
                        timeout: 15000,
                        enableHighAccuracy: true
                    }*/
                }
            },     
            coordinate: {
                include: true,
                expendable: true,
                collapse: has('phone'),
                id: 'coordinate',
                type: 'view',
                path: 'esri/widgets/CoordinateConversion',
                placeAt: 'bottom-left',
                position: 3,
                options: {
                    view: true/*,
                    publishGPSPosition: true,
                    highlightLocation: true,
                    useTracking: true,
                    geolocationOptions: {
                        maximumAge: 0,
                        timeout: 15000,
                        enableHighAccuracy: true
                    }*/
                }
            },    
            basemaps: {
                include: true,
                expendable: true,
                collapse: has('phone'),
                id: 'basemaps',
                type: 'view',
                path: 'esri/widgets/BasemapGallery',
                placeAt: 'top-right',
                position: 1,
                options: 'config/basemaps'
            },  
            fullscreen: {
                include: true,
                id: 'fullscreen',
                type: 'view',
                path: 'esri/widgets/Fullscreen',
                placeAt: 'top-right',
                position: 2,
                options: {
                    view: true
                }
            },         
            layerControl: {
                include: true,
                id: 'layerControl',
                type: 'titlePane',
                path: 'widgets/LayerControl',
                title: i18n.viewer.widgets.layerControl,
                //iconClass: 'fas fa-fw fa-th-list',

                iconClass: 'fas fa-fw fa-solid fa-layer-group',
                open: false,
                position: 0,
                options: {
                    view: true,
                    layerControlLayerInfos: true,
                    separated: true,
                    vectorReorder: true,
                    overlayReorder: true,
                    // create a custom menu entry in all of these feature types
                    // the custom menu item will publish a topic when clicked
                    menu: {
                        feature: [{
                            topic: 'hello',
                            iconClass: 'fas fa-fw fa-smile',
                            label: 'Say Hello'
                        }]
                    },
                    //create a example sub layer menu that will
                    //apply to all layers of type 'dynamic'
                    subLayerMenu: {
                        dynamic: [{
                            topic: 'goodbye',
                            iconClass: 'fas fa-fw fa-frown',
                            label: 'Say goodbye'
                        }]
                    }
                }
            },
            identify: {
                include: true,
                id: 'identify',
                type: 'titlePane',
                path: 'widgets/Identify',
                title: i18n.viewer.widgets.identify,
                iconClass: 'fas fa-fw fa-info-circle',
                open: false,
                preload: true,
                position: 3,
                options: 'config/identify'
            },
            bookmarks: {
                include: true,
                id: 'bookmarks',
                type: 'titlePane',
                path: 'widgets/Bookmarks',
                title: i18n.viewer.widgets.bookmarks,
                iconClass: 'fas fa-fw fa-bookmark',
                open: false,
                position: 2,
                options: 'config/bookmarks'
            },
            search: {
                include: true,
                id: 'search',
                type: 'titlePane',
                iconClass: 'fas fa-fw fa-search',
                path: 'widgets/Search',
                title: 'Recherche',
                open: false,
                position: 3,
                canFloat: true,
                paneOptions: {
                    resizable: true,
                    resizeOptions: {
                        minSize: {
                            w: 650,
                            h: 520
                        }
                    }
                },
                options: 'config/searchWidget'
            },
            what3words: {
                include: true,
                id: 'what3words',
                type: 'titlePane',
                iconClass: 'fas fa-fw fa-solid fa-w',
                title: 'what3words',
                canFloat: true,
                position: 4,
                open: false,
                path: 'widgets/What3Words',
                options: {
                    view: true,
                    key: 'MWXMKVG5'
                }
            },
            draw: {
                include: true,
                id: 'draw',
                type: 'titlePane',
                canFloat: true,
                path: 'widgets/Draw',
                title: i18n.viewer.widgets.draw,
                iconClass: 'fas fa-fw fa-paint-brush',
                open: false,
                position: 5,
                options: {
                    view: true,
                    mapViewClickMode: true
                }
            },
            measure: {
                include: true,
                id: 'measurement',
                type: 'titlePane',
                canFloat: true,
                path: 'widgets/Measurement',
                title: i18n.viewer.widgets.measure,
                iconClass: 'fas fa-fw fa-expand',
                open: false,
                position: 6,
                options: {
                    view: true,
                    mapClickMode: true,
                    defaultAreaUnit: units.SQUARE_METERS,
                    defaultLengthUnit: units.METERS
                }
            },
            print: {
                include: true,
                id: 'print',
                type: 'titlePane',
                path: 'widgets/PrintPlus',
                canFloat: false,
                title: 'Impression',
                iconClass: 'fas fa-print',
                open: false,
                position: 7,
                options: 'config/printplusWidget'
            },            
            directions: {
                include: true,
                id: 'directions',
                type: 'titlePane',
                path: 'widgets/Directions',
                title: i18n.viewer.widgets.directions,
                iconClass: 'fas fa-fw fa-map-signs',
                open: false,
                position: 8,
                options: {
                    view: true,
                    mapViewRightClickMenu: true,
                    options: {
                        routeServiceUrl: 'https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Route',
                        visibleElements: {
                            layerDetailsLink: false,
                            saveAsButton: false,
                            saveButton: false
                        },
                        unit: 'kilometers',
                        searchProperties: {
                            includeDefaultSources: false,
                            autoNavigate: false,
                            sources: [
                                {
                                    url: 'https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer',
                                    singleLineFieldName: "SingleLine",
                                    name: "Mes adresses",
                                    placeholder: "Recherche d'adresse",
                                    maxResults: 3,
                                    maxSuggestions: 6,
                                    minSuggestCharacters: 4,
                                    suggestionsEnabled: true,
                                    outFields: ["Match_addr"]
                                }
                            ]
                        }
                    }
                }
            },
            editor: {
                include: has('phone') ? false : true,
                id: 'editor',
                type: 'titlePane',
                canFloat: true,
                path: 'widgets/Editor',
                title: i18n.viewer.widgets.editor,
                iconClass: 'fas fa-fw fa-pencil-alt',
                open: false,
                position: 9,
                options: {
                    view: true,
                    mapViewClickMode: true,
                    editorLayerInfos: true,
                    settings: {
                        toolbarVisible: true,
                        showAttributesOnClick: true,
                        enableUndoRedo: true,
                        createOptions: {
                            polygonDrawTools: ['freehandpolygon', 'autocomplete']
                        },
                        toolbarOptions: {
                            reshapeVisible: true,
                            cutVisible: true,
                            mergeVisible: true
                        }
                    }
                }
            },
	    streetview: {
                include: true,
                id: 'streetview',
                type: 'titlePane',
                canFloat: true,
                position: 10,
                path: 'widgets/StreetView',
                title: i18n.viewer.widgets.streetview,
                iconClass: 'fas fa-fw fa-street-view',
                paneOptions: {
                    resizable: true,
                    resizeOptions: {
                        minSize: {
                            w: 250,
                            h: 250
                        }
                    }
                },
                options: {
                    view: true,
                    mapViewClickMode: true,
                    mapViewRightClickMenu: true
                }
            },
            attributesTable: {
                include: true,
                id: 'attributesContainer',
                type: 'domNode',
                srcNodeRef: 'attributesContainer',
                path: 'widgets/AttributesTable',
                options: {
                    view: true,
                    mapViewClickMode: true,

                    // use a tab container for multiple tables or
                    // show only a single table
                    useTabs: true,

                    // used to open the sidebar after a query has completed
                    sidebarID: 'sidebarBottom'
                }
            },
            messagebox: {
                include: true,
                type: 'invisible',
                path: 'widgets/MessageBox',
                options: {}
            },
            myInfo: {                   // sample configuration
                include: true,
                id: 'myInfo',
                type: 'floating',
                title: 'MyInfo',
                preload: true,
                path: 'widgets/MyInfo',
                options: {
                    attachTo: 'sidebarLeft', // the dom node to place MyInfo
                    position: 'last', // ?first?, ?last?, or ?only?
                    href: 'widgets/myInfo.html' // provide HTML
                    //content: '<div>My Content</div>' // or pass in a string as an alternative to href
                }
            },
            intro: {
                include: true,
                id: 'introduction',
                type: 'invisible',
                path: 'widgets/Introduction',
                options: {
                    html: '<span class="dijitButton" style="color:#333"><span class="dijitReset dijitInline dijitButtonNode"><span class="dijitReset dijitStretch dijitButtonContents"><span class="dijitReset dijitInline dijitIcon fa fa-video-camera"></span><span class="dijitReset dijitInline dijitButtonText">Introduction</span></span></span></span>',
                    domTarget: 'helpDijit',
                    showAtStartup: true,
                    cookieOptions: {
                        expires: new Date(Date.now() + (360000 * 24 * 30)) // show every 30 days
                    },
            
                    // Documentation https://introjs.com/docs/themes/list
                    introTheme: 'modern',
            
                    // Documentation: https://introjs.com/docs/intro/options/
                    introOptions: {
                        steps: [
                            {
                                intro: [
                                    '<div style="width:350px;">',
                                    '<h4>Bienvenue sur l&#039application Web du Syst&egrave;me d&#039Information G&eacute;ographique du SDIS 14</h4>',
                                    'Nous esp&eacute;rons que vous appr&eacute;cierez et trouverez utile notre br&egrave;ve introduction &agrave; la visionneuse de carte<br/><br/>',
                                    '<div style="text-align:center">',
                                    '<img src="images/logo-SDIS14.png" style="width:100px;" /><br/>',
                                    '<a href="https://www.sdis14.fr" target="_blank" style="color:#fff;text-decoration:underline;">Site du SDIS 14</a>',
                                    '</div><br/>',
                                    '</div>'
                                ].join('')
                            },
                            {
                                element: '#mapViewCenter',
                                intro: '<h4>Navigation cartographique</h4>Utilisez la souris et le clavier pour :<br/>' +
                                    [
                                        '<ul>',
                                        '<li>Faites glisser pour faire un d&eacute;placement</li>',
                                        '<li>SHIFT + Cliquez pour recentrer</li>',
                                        '<li>SHIFT + Faites glisser pour zoomer</li>',
                                        '<li>SHIFT + CTRL + Faites glisser pour effectuer un zoom arri&egrave;re</li>',
                                        '<li>Faites d&eacute;filer la souris vers l&#039avant pour zoomer</li>',
                                        '<li>Faites d&eacute;filer la souris vers l&#039arri&egrave;re pour effectuer un zoom arri&egrave;re</li>',
                                        '<li>Utilisez les touches fl&eacute;ch&eacute;es pour effectuer un d&eacute;placement</li>',
                                        '<li>+ Touche pour zoomer sur un niveau</li>',
                                        '<li>- Touche pour d&eacute;zoomer d&#039un niveau</li>',
                                        '<li>Double-cliquez pour centrer et zoomer</li>',
                                        '</ul>'
                                    ].join('')
                            },
                            {
                                element: '.esri-expand',
                                intro: '<h4>Widget de recherche</h4>Diverses recherches peuvent &ecirc;tre effectu&eacute;es avec le widget Recherche :' + [
                                    '<ul>',
                                    '<li>Rechercher par adresse</li>',
                                    '<li>Rechercher par nom de lieu</li>',
                                    '<li>Recherche par code postal, commune, etc.</li>',
                                    '</ul>'
                                ].join(''),
                                position: 'right'
                            },
                            {
                                element: '.esri-home',
                                intro: '<h4>Boutons &#039Home&#039</h4>Vous permet de revevir &agrave; la vue initiale'
                            },
                            {
                                element: '.esri-locate',
                                intro: '<h4>Boutons G&eacute;olocalisation</h4>Vous permet de vous g&eacute;olocalier (avec le GPS de votre smartphone ou tablette)'
                            },
                            {
                                element: '.esri-zoom',
                                intro: '<h4>Boutons de zoom</h4>Vous pouvez effectuer un zoom avant et arri&egrave;re sur la carte en cliquant sur ces boutons.'
                            }, 
                            {
                                element: '.esri-fullscreen',
                                intro: '<h4>Boutons Plein &eacute;cran</h4>Vous permet d&#039afficher la carte en pleine &eacute;cran (il faute utiliser le mode normal pour avoir acc&egrave;s aux outils).'
                            },
                            /*{
                                element: '#esri-expand .esri-basemap-gallery',
                                intro: '<h4>Boutons de fond de plan</h4>Vous pouvez changer le fond de plan de la carte en cliquant sur ce bouton.'
                            },*/
                            {
                                element: '#sidebarLeft',
                                intro: '<h4>Barre lat&eacute;rale de gauche</h4>Vous trouverez de nombreux widgets contenus dans le volet de la barre lat&eacute;rale gauche.',
                                position: 'right'
                            },
                            {
                                element: '.sidebarleftCollapseButton',
                                intro: '<h4>Agrandir/r&eacute;duire la barre lat&eacute;rale</h4>R&eacute;duire la barre lat&eacute;rale',
                                position: 'right'
                            },
                            {
                                element: '#layerControl_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget de contr&ocirc;le des couches</h4>Vous pouvez modifier la visibilit&eacute; des calques &agrave; l&#039aide du widget Contr&ocirc;le des calques.',
                                position: 'right'
                            },
                            {
                                element: '#bookmarks_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget de g&eacute;osignets</h4>Le widget G&eacute;osignets permet zoomer sur des vues pr&eacute;d&eacute;finies',
                                position: 'right'
                            },
                            {
                                element: '#search_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget de recherche d&#039&eacute;lements</h4>Vous pouvez rechercher des &eacute;lements contenus dans les calques.',
                                position: 'right'
                            },
                            {
                                element: '#what3words_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget &#039what3words&#039</h4>Le widget &#039what3words&#039 permet de g&eacute;olocaliser une position avec le formalisme de &#039what3word&#039',
                                position: 'right'
                            },                           
                            {
                                element: '#draw_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget d&#039annotations</h4>Le widget Annotations permet d&#039ajouter des annotations sous forme de points, de lignes, de polygones ou de surfaces sur la carte.',
                                position: 'right'
                                        },
                            {
                                element: '#measurement_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget de mesure</h4>Le widget Mesure permet de r&eacute;aliser une mesure de distance ou de surface sur la carte et de sp&eacute;cifier l&#039unit&eacute; de mesure.',
                                position: 'right'
                            },
                            {
                                element: '#print_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget d&#039impression</h4>Cette carte peut &ecirc;tre export&eacute;e vers diff&eacute;rents formats et mises en page &agrave; l&#039aide du widget Imprimer.',
                                position: 'right'
                            },
                            {
                                element: '#directions_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget Itin&eacute;raire</h4>Le widget Itin&eacute;raire permet de faire des calculs d&#039itin&eacute;raires sur la carte et d&#039afficher la feuille de route.',
                                position: 'right'
                            },
                            {
                                element: '#editor_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget d&#039&eacute;dition</h4>Le widget Edition permet d&#039vditer les objets g&eacute;ographique.',
                                position: 'right'
                            },
                            /*{
                                element: '#streetview_parent .dijitTitlePaneTitle',
                                intro: '<h4>Widget Streetview</h4>Le widget Streetview permet d&#039afficher la vue Google Streeview sur point cliqu&eacute; sur la carte.',
                                position: 'right'
                            },*/
                            {
                                element: '#helpDijit',
                                intro: '<h4>Rejouer cette introduction</h4>Vous pouvez revoir cette introduction en cliquant ici.',
                                position: 'left'
                            }
                        ]
                    }
                }
            }

        }
    };
});

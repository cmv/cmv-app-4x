define([
    'dojo/i18n!./nls/main',

    'esri/Basemap',
    'esri/layers/TileLayer',
    'esri/layers/WebTileLayer',
    'esri/layers/WMSLayer',
    'esri/layers/WMTSLayer',
    'esri/widgets/BasemapGallery'

], function (
    i18n,
    Basemap,
    TileLayer,
    WebTileLayer,
    WMSLayer,
    WMTSLayer,
    BasemapGallery

) {

    function setBaseMaps() {
        var view = document.getElementsByName('mapViewCenter');

        if (view != null) {
            // Fond de base du SDIS
            var LocalFondDeBase = new Basemap({
                baseLayers: [
                    new TileLayer({
                        url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer',
                        title: 'World_Street_Map',
                        opacity: 0.7
                    })
                ],
                title: 'World_Street_Map',
                id: 'World_Street_Map',
                thumbnailUrl: '/images/FondDeBase.png'
            });
            var LocalFondOrtho = new Basemap({
                baseLayers: [
                    new TileLayer({
                        url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
                        title: 'Ortho',
                        opacity: 0.8
                    })
                ],
                title: 'World_Imagery',
                id: 'World_Imagery',
                thumbnailUrl: '/images/Ortho.png'
            });            
            var WebOSM = new Basemap({
                baseLayers: [
                    new WebTileLayer({
			//url: 'https://{subDomain}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        urlTemplate: 'https://{subDomain}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			subDomains: ['a', 'b', 'c'],
                        title: 'FondOSM',
                        opacity: 0.7
                    })
                ],
                title: 'OSM',
                id: 'WebOSM',
                thumbnailUrl: '/images/FondOSM.png'
            });	   

	    var WebIGNPlus1 = new Basemap({
                baseLayers: [
                    new WMTSLayer({
                    //new WMSLayer({
			//url: 'https://wxs.ign.fr/3d21h25fnv2u8tkihd8u69l9/geoportail/wmts', 
			//url: 'https://data.geopf.fr/annexes/ressources/wms-r/cartes.xml', 
			url: 'https://data.geopf.fr/wmts', 
			activeLayer: { 
				id:'GEOGRAPHICALGRIDSYSTEMS.MAPS.BDUNI.J1' 
			},
			spatialReference: { wkid: 2154 }
                        //title: 'IGN + 1 ',
                        //opacity: 0.7
                    })
                ],
                title: 'IGN+1',
                id: 'WebIGNPlus1',
                thumbnailUrl: '/images/FondIGN+1.png'
            });


            var basemapGallery = new BasemapGallery({
                view: view,
                source: [LocalFondDeBase, LocalFondOrtho, WebOSM, WebIGNPlus1] //, WebGoogleMaps  ]
            });

            return basemapGallery;
        }
        return null;
    }

    return setBaseMaps();
});
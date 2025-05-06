define([
    'dojo/i18n!./nls/main',
    'esri/widgets/Search',
    'esri/widgets/Search/LocatorSearchSource'
], function (i18n, Search, LocatorSearchSource) {

    return {
        view: true,
        includeDefaultSources: false,
        activeMenu: "suggestion",
        editingEnabled: false,
        locationEnabled: false,    
        popupEnabled: false,  
        sources: [
            {
                url: "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer",
                singleLineFieldName: "SingleLine",
                name: "My Address Points",
                placeholder: "Recherche d'adresse",
                maxResults: 3,
                maxSuggestions: 6,
                minSuggestCharacters: 4,
                suggestionsEnabled: true,
                outFields: ["Match_addr"],
                resultSymbol: {
                    type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
                    url: "/images/search-result.png",
                    size: 24,
                    width: 24,
                    height: 24,
                    xoffset: 0,
                    yoffset: 0
                }
            }
        ]
    };
});
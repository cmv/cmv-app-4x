define({
    view: true,
    growler: true,
    printTaskURL: 'https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
    copyrightText: 'Copyright 2025',
    authorText: 'Me',
    defaultTitle: 'Viewer Map',
    defaultFormat: 'PDF',
    defaultLayout: 'Letter ANSI A Landscape',

    //Print Enhancements BEGIN
    defaultDpi: 96,
    noTitleBlockPrefix: 'No TB ',
    layoutParams: {
        // The params array defines the template dimensions so the template footprint can be displayed on the map.
        // The first item is the page size.
        // The second item is the map hole size.
        // The third item is the offset to the lower left corner of the map area.
        // The fourth item is the side and top borders for the layout with no title block.
        /*'Letter ANSI A Landscape': {
            alias: 'Letter Landscape (ANSI A)',
            units: 'esriInches',
            pageSize: {x: 11, y: 8.5},
            mapSize: {x: 10, y: 6.25},
            pageMargins: {x: 0.5, y: 1.5},
            titleBlockOffsets: {x: 0.5, y: 0.5}
        },
        'Letter ANSI A Portrait': {
            alias: 'Letter Portrait (ANSI A)',
            units: 'esriInches',
            pageSize: {x: 8.5, y: 11},
            mapSize: {x: 7.5, y: 8},
            pageMargins: {x: 0.5, y: 2.25},
            titleBlockOffsets: {x: 0.5, y: 0.5}
        },
        'Tabloid ANSI B Landscape': {
            alias: 'Tabloid Landscape (ANSI B)',
            units: 'esriInches',
            pageSize: {x: 17, y: 11},
            mapSize: {x: 16, y: 7.75},
            pageMargins: {x: 0.5, y: 2.5},
            titleBlockOffsets: {x: 0.5, y: 0.5}
        },
        'Tabloid ANSI B Portrait': {
            alias: 'Tabloid Portrait (ANSI B)',
            units: 'esriInches',
            pageSize: {x: 11, y: 17},
            mapSize: {x: 10, y: 11.75},
            pageMargins: {x: 0.5, y: 4.5},
            titleBlockOffsets: {x: 0.5, y: 0.5}
        },*/
        'A4_Paysage': {
            alias: 'A4 Paysage',
            units: 'esriCentimeters',
            pageSize: {x: 29.7, y: 21},
            mapSize: {x: 28.8545, y: 20.155},
            pageMargins: {x: 0.4233 , y: 0.4233},
            titleBlockOffsets: {x: 11 , y: 19 }
        },
        'A4_Portrait': {
            alias: 'A4 Portrait',
            units: 'esriCentimeters',
            pageSize: {x: 21, y: 29.7},
            mapSize: {x: 20.155, y: 28.8545},
            pageMargins: {x: 0.4233 , y: 0.4233},
            titleBlockOffsets: {x: 6.5, y: 27.7}
        },
        'A3_Paysage': {
            alias: 'A3 Paysage',
            units: 'esriCentimeters',
            pageSize: {x: 42, y: 29.7},
            mapSize: {x: 41.1523, y: 28.8545},
            pageMargins: {x: 0.4233 , y: 0.4233},
            titleBlockOffsets: {x: 16.5, y: 27.5}
        },
        'A3_Portrait': {
            alias: 'A3 Portrait',
            units: 'esriCentimeters',
            pageSize: {x: 29.7, y: 42},
            mapSize: {x: 28.8545, y: 41.1523 },
            pageMargins: {x: 0.4233 , y: 0.4233},
            titleBlockOffsets: {x: 11, y: 19}
        },
	'FIRE_plan_de_situ_205x195': {
            alias: 'FIRE: plan 20,5x19,5',
            units: 'esriCentimeters',
            pageSize: {x: 19.5, y: 20.5},
            mapSize: {x: 19.5, y: 19.1169},
            pageMargins: {x: 0, y: 1.3831},
            titleBlockOffsets: {x: 0, y: 0}
        },
	'FIRE_plan_de_situ_400x205': {
            alias: 'FIRE: plan 40x20,5',
            units: 'esriCentimeters',
            pageSize: {x: 40.0, y: 20.5},
            mapSize: {x: 40.0, y: 19.116 },
            pageMargins: {x: 0, y: 1.3831},
            titleBlockOffsets: {x: 0, y: 0}
        },
	/*'FIRE: plan de masse A3': {
            alias: 'FIRE : A3',
            units: 'esriCentimeters',
            pageSize: {x: 40.0, y: 20.5},
            mapSize: {x: 39.9781, y: 19.116 },
            pageMargins: {x: 0.0315, y: 0},
            titleBlockOffsets: {x: 1.3753, y: 0}
        },*/
        'MAP_ONLY': {
            alias: 'Carte seulement',
            units: NaN,
            pageSize: {x: 0, y: 0},
            mapSize: {x: 0, y: 0},
            pageMargins: {x: 0, y: 0},
            titleBlockOffsets: {x: 0, y: 0}
        }
    },
    relativeScale: '(1 centimetre = [value] metres)',
    relativeScaleFactor: 0.1,
    scalePrecision: 4,
    //mapScales: [6336000, 5068800, 3801600, 3168000, 2534400, 1900800, 1267200, 633600, 506880, 380160, 316800, 253440, 190080, 126720, 63360, 50688, 38016, 31680, 25344, 19008, 12672, 6336, 5069, 3802, 3168, 2534, 1901, 1267, 634, 507, 380, 317, 253, 190, 127, 63],
    mapScales: [500000, 400000, 300000, 200000, 150000, 100000, 75000, 50000, 35000, 20000, 15000, 10000, 7500, 5000, 2500, 1000, 500],
    outWkid: 2154,
    showLayout: true
    //Print Enhancements END
});
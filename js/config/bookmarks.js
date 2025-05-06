define([
    'dojo/i18n!./nls/main',
    'esri/webmap/Bookmark'
], function (i18n, Bookmark) {

    return {
        view: true,
        editingEnabled: true,
        bookmarks: [ // array of bookmarks defined manually
            {
                name: "Groupement Est",
                viewpoint: {
                    targetGeometry: {
                        type: "extent",
                        spatialReference: {
                            wkid: 2154
                        },
                        xmin: 474724,
                        ymin: 6817819,
                        xmax: 523159,
                        ymax: 6930335
                    }
                }
            },
            {
                name: "Groupement Ouest",
                viewpoint: {
                    targetGeometry: {
                        type: "extent",
                        spatialReference: {
                            wkid: 2154
                        },
                        xmin: 398364,
                        ymin: 6902547,
                        xmax: 474724,
                        ymax: 6929855
                    }
                }
            },
            {
                name: "Groupement Sud",
                viewpoint: {
                    targetGeometry: {
                        type: "extent",
                        spatialReference: {
                            wkid: 2154
                        },
                        xmin: 394496,
                        ymin: 6856687,
                        xmax: 470009,
                        ymax: 6891446
                    }
                }
            }
        ]
        /*bookmarks: [ // array of bookmarks defined manually
            new Bookmark({
                name: "Angeles National Forest",
                viewpoint: {
                    targetGeometry: {
                        type: "extent",
                        spatialReference: {
                            wkid: 102100
                        },
                        xmin: -13139131.948889678,
                        ymin: 4047767.23531948,
                        xmax: -13092887.54677721,
                        ymax: 4090610.189673263
                    }
                }
            }),
            new Bookmark({
                name: "Crystal Lake",
                viewpoint: {
                    targetGeometry: {
                        type: "extent",
                        spatialReference: {
                            wkid: 102100
                        },
                        xmin: -13125852.551697943,
                        ymin: 4066904.1101411926,
                        xmax: -13114291.451169826,
                        ymax: 4077614.8487296384
                    },
                    rotation: 90
                }
            })
        ]*/
    };
});
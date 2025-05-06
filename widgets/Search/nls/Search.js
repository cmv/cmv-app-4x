// http://dojotoolkit.org/reference-guide/1.10/dojo/i18n.html
define({
    root: {
        Labels: {
            selectALayer: 'Selectionnez un calque',
            selectAQuery: 'Selectionnez une requete',
            spatialFilter: 'Appliquer le filtre spatial',
            buffer: 'Zone tampon',
            displayBuffer: 'Afficher la zone tampon uniquement',
            attributeAddToExisting: 'Ajouter aux resultats existants',
            spatialAddToExisting: 'Ajouter aux resultats existants',
            selectFeaturesBy: 'Selectionner les elements par',
            tabTitleByAttribute: 'Par attribut',
            tabTitleByShape: 'Par forme',
            exactMatches: 'Rechercher uniquement les correspondances exactes',

            importDialogTitle: 'Importer une requete',
            exportDialogTitle: 'Exporter une requete',

            // used for "Filtres spatiaux"
            spatialFilters: {
                entireMap: 'Carte entière (pas de filtre)',
                currentExtent: 'Etendue actuelle de la carte',
                identifiedFeature: 'Elements identifies',
                searchSource: 'Filtre spatial utilise pour la recherche',
                searchFeatures: 'Elements dans les resultats de recherche',
                searchSelected: 'Elements selectionnes dans les resultats de recherche',
                searchBuffer: 'Zone tampon pour la recherche'
            }
        },
        Buttons: {
            search: {
                label: 'Rechercher',
                showLabel: true
            },
            stopDrawing: {
                label: 'Arreter de dessiner',
                showLabel: true
            },
            selectByRectangle: {
                label: 'Selectionner par rectangle',
                showLabel: false
            },
            selectByCircle: {
                label: 'Selectionner par cercle',
                showLabel: false
            },
            selectByPoint: {
                label: 'Selectionner par point',
                showLabel: false
            },
            selectByPolyline: {
                label: 'Selectionner par ligne',
                showLabel: false
            },
            selectByFreehandPolyline: {
                label: 'Selectionner par ligne a main levee',
                showLabel: false
            },
            selectByPolygon: {
                label: 'Selectionner par polygone',
                showLabel: false
            },
            selectByFreehandPolygon: {
                label: 'Selectionner par polygone a main leee',
                showLabel: false
            },
            selectByIdentify: {
                label: 'Selectionner par elements(s) identifie(s)',
                showLabel: false
            },
            selectBySelected: {
                label: 'Selectionner par elements(s) selectionne(s)',
                showLabel: false
            },
            switchToBasic: {
                label: 'Passer a la recherche de base',
                showLabel: true
            },
            switchToAdvanced: {
                label: 'Passer a la recherche avancee',
                showLabel: true
            },
            importSQL: {
                label: 'Importer',
                showLabel: false
            },
            exportSQL: {
                label: 'Exporter',
                showLabel: false
            },
            clearFields: {
                label: 'Nettoyer',
                showLabel: true
            }
        }
    }
});
// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/3.43/esri/copyright.txt for details.
//>>built
define("gis/esri/graphicsUtils",
    ["dojo/_base/lang",
        "dojo/_base/array",
        "dojo/has",
        //"./kernel",
        "esri/geometry/Extent"
], function (
        k,
        g,
        l,
        //m,
        n
    ){
        var h = {
            graphicsExtent: function (d) {
                if (!d || !d.length) return null;
                var b = null, c, e = d.length;

                for (c = 0; c < e; c++){
                    var a = d.items[c].geometry;
                    if (a)
                    {
                        var f = a.extent;
                        f || "point" !== a.type || null == a.x || null == a.y || (f = new n(a.x, a.y, a.x, a.y, a.spatialReference));
                        f && (b = b ? b.union(f) : f)
                    }
                }
                return 0 > b.width && 0 > b.height ? null : b
            },
            getGeometries: function (d) {
                return g.map(d, function (b) { return b.geometry })
            },
            _encodeGraphics: function (d, b) {
                return g.map(d, function (c, e) { c = c.toJson(); var a = {}; c.geometry && (e = b && b[e], a.geometry = e && e.toJson() || c.geometry); c.attributes && (a.attributes = c.attributes); return a })
            }
    }; l("extend-esri") && k.mixin(m, h); return h
});
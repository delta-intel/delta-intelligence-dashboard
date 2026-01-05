export const mapStyle = {
  "glyphs": "https://tiles.stadiamaps.com/fonts/{fontstack}/{range}.pbf?api_key=b65a1e40-d1e8-4877-beac-ead8d249580b",
  "layers": [
    {
      "id": "land",
      "type": "background",
      "layout": {},
      "paint": {
        "background-color": "rgba(21, 21, 24, 1)"
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "stamen-omt",
      "source-layer": "water",
      "layout": {},
      "paint": {
        "fill-color": "rgba(13, 13, 15, 1)"
      }
    },
    {
      "id": "national-boundary-bg",
      "type": "line",
      "source": "stamen-omt",
      "source-layer": "boundary",
      "minzoom": 6,
      "filter": [
        "all",
        ["==", ["get", "admin_level"], 2],
        ["==", ["get", "disputed"], 0],
        ["==", ["get", "maritime"], 0]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "hsl(0, 0%, 0%)",
        "line-opacity": ["step", ["zoom"], 0, 5.5, 1, 8.5, 0],
        "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1, 6, 2]
      }
    },
    {
      "id": "subnational-boundary",
      "type": "line",
      "source": "stamen-omt",
      "source-layer": "boundary",
      "minzoom": 1.5,
      "filter": [
        "all",
        ["match", ["get", "admin_level"], [3, 4], true, false],
        ["==", ["get", "maritime"], 0]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "rgba(255, 255, 255, 0.13)",
        "line-dasharray": ["step", ["zoom"], ["literal", [1, 0]], 6, ["literal", [0.25, 4]], 9, ["literal", [0.25, 2]]],
        "line-width": ["interpolate", ["linear"], ["zoom"], 1.5, 0.3, 9, 2]
      }
    },
    {
      "id": "national-boundary",
      "type": "line",
      "source": "stamen-omt",
      "source-layer": "boundary",
      "minzoom": 1,
      "filter": [
        "all",
        ["==", ["get", "admin_level"], 2],
        ["==", ["get", "disputed"], 0],
        ["==", ["get", "maritime"], 0]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "rgba(255, 255, 255, 0.12)",
        "line-dasharray": ["step", ["zoom"], ["literal", [1, 0]], 6, ["literal", [2, 3]], 8.5, ["literal", [2, 2]]],
        "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1, 6, 2]
      }
    },
    {
      "id": "national-boundary-disputed",
      "type": "line",
      "source": "stamen-omt",
      "source-layer": "boundary",
      "minzoom": 1,
      "filter": [
        "all",
        ["==", ["get", "admin_level"], 2],
        ["any",
          ["all", ["==", ["get", "disputed"], 1], ["==", ["get", "maritime"], 0]],
          ["match", ["id"], [238797482, 330695990, 330696000, 330696028, 330696042, 731895849, 731896898, 130207714, 919865757, 130072456, 130207737, 722542321, 722542322, 910464113, 216249910], true, false]
        ]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "rgba(255, 255, 255, 0.26)",
        "line-dasharray": ["step", ["zoom"], ["literal", [0.001, 1.501]], 4, ["literal", [0.001, 2.501]], 7, ["literal", [0.001, 3.001]]],
        "line-width": ["interpolate", ["linear"], ["zoom"], 0, 2, 6, 3]
      }
    },
    {
      "id": "settlement-minor-label",
      "type": "symbol",
      "source": "stamen-omt",
      "source-layer": "place",
      "minzoom": 2,
      "maxzoom": 13,
      "filter": [
        "all",
        ["match", ["get", "class"], "town", true, false],
        ["step", ["zoom"], ["<=", ["get", "rank"], 6], 7, ["<=", ["get", "rank"], 7], 8, ["<=", ["get", "rank"], 11], 9, ["<=", ["get", "rank"], 12], 10, true]
      ],
      "layout": {
        "symbol-sort-key": ["get", "rank"],
        "text-anchor": ["step", ["zoom"], "top-left", 8, "center"],
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["step", ["zoom"], ["literal", ["Inter Regular"]], 6, ["literal", ["Inter Bold"]]],
        "text-justify": "auto",
        "text-line-height": 1.1,
        "text-max-width": 7,
        "text-radial-offset": ["step", ["zoom"], 0.4, 8, 0],
        "text-size": ["interpolate", ["cubic-bezier", 0.2, 0, 0.9, 1], ["zoom"], 6, ["step", ["get", "rank"], 10, 7, 9], 8, ["step", ["get", "rank"], 12, 12, 10], 13, ["step", ["get", "rank"], 16, 12, 14, 15, 12]]
      },
      "paint": {
        "text-color": "rgba(10, 219, 149, 1)",
        "text-halo-blur": 1,
        "text-halo-color": "hsl(0, 0%, 0%)",
        "text-halo-width": 2.5
      }
    },
    {
      "id": "settlement-major-label",
      "type": "symbol",
      "source": "stamen-omt",
      "source-layer": "place",
      "minzoom": 2.5,
      "maxzoom": 12,
      "filter": [
        "all",
        ["match", ["get", "class"], "city", true, false],
        ["step", ["zoom"], false, 2, ["<=", ["get", "rank"], 3], 4, ["<=", ["get", "rank"], 4], 5, ["<=", ["get", "rank"], 5], 6, ["<=", ["get", "rank"], 7], 7, ["<=", ["get", "rank"], 8], 8, ["<=", ["get", "rank"], 11], 9, true]
      ],
      "layout": {
        "symbol-sort-key": ["get", "rank"],
        "text-anchor": ["step", ["zoom"], "top-left", 8, "center"],
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["step", ["zoom"], ["literal", ["Inter Regular"]], 6, ["literal", ["Inter Bold"]]],
        "text-justify": "auto",
        "text-line-height": 1.1,
        "text-max-width": 7,
        "text-radial-offset": ["step", ["zoom"], 0.4, 8, 0],
        "text-size": ["interpolate", ["cubic-bezier", 0.2, 0, 0.9, 1], ["zoom"], 3, ["step", ["get", "rank"], 12, 2, 10], 6, ["step", ["get", "rank"], 20, 2, 17, 3, 15, 4, 12], 8, ["step", ["get", "rank"], 22, 4, 17, 6, 14], 15, ["step", ["get", "rank"], 26, 4, 22, 6, 16]]
      },
      "paint": {
        "text-color": "rgba(10, 219, 149, 1)",
        "text-halo-blur": 1,
        "text-halo-color": "hsl(0, 0%, 0%)",
        "text-halo-width": 2.5
      }
    },
    {
      "id": "country-label",
      "type": "symbol",
      "source": "stamen-omt",
      "source-layer": "place",
      "minzoom": 1.5,
      "maxzoom": 5.5,
      "filter": ["match", ["get", "class"], ["country", "disputed_country"], true, false],
      "layout": {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["step", ["zoom"], ["literal", ["Inter Regular"]], 2, ["literal", ["Inter Bold"]]],
        "text-justify": ["step", ["zoom"], ["match", ["get", "text_anchor"], ["left", "bottom-left", "top-left"], "left", ["right", "bottom-right", "top-right"], "right", "center"], 7, "auto"],
        "text-line-height": 1.1,
        "text-max-width": 6,
        "text-radial-offset": ["step", ["zoom"], 0.6, 8, 0],
        "text-size": ["interpolate", ["linear"], ["zoom"], 1.5, 10, 4, 13, 6, 20]
      },
      "paint": {
        "text-color": "rgba(10, 219, 149, 1)",
        "text-halo-color": "hsl(0, 0%, 0%)",
        "text-halo-width": 2
      }
    },
    {
      "id": "continent-label",
      "type": "symbol",
      "source": "stamen-omt",
      "source-layer": "place",
      "maxzoom": 1.5,
      "filter": ["==", ["get", "class"], "continent"],
      "layout": {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Inter Regular"],
        "text-letter-spacing": 0.05,
        "text-line-height": 1.3,
        "text-max-width": 6,
        "text-size": ["interpolate", ["exponential", 0.5], ["zoom"], 0, 2, 1.5, 18]
      },
      "paint": {
        "text-color": "rgba(10, 219, 149, 1)",
        "text-halo-color": "hsl(0, 0%, 0%)",
        "text-halo-width": 1.5
      }
    }
  ],
  "name": "Delta Intelligence Map",
  "sources": {
    "stamen-omt": {
      "type": "vector",
      "scheme": "xyz",
      "url": "https://tiles.stadiamaps.com/data/stamen-omt.json?api_key=b65a1e40-d1e8-4877-beac-ead8d249580b"
    }
  },
  "sprite": "https://tiles.stadiamaps.com/styles/stamen-toner/sprite",
  "version": 8
};

/* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

import { originDestinationMatrix } from "../src/originDestinationMatrix";

import * as fetchMock from "fetch-mock";

import {
  OriginDestinationMatrix,
  OriginDestinationMatrix_esriNAODOutputStraightLines,
  OriginDestinationMatrix_esriNAODOutputNoLines,
  OriginDestinationMatrix_AllBarrierTypes,
  OriginDestinationMatrix_AllBarrierTypes_WebMercator,
} from "./mocks/responses";
import {
  IPoint,
  ILocation,
  IFeatureSet,
  IPolyline,
  IPolygon,
} from "@esri/arcgis-rest-types";

// variations on `origins` and `destinations` required input params

const origins: Array<[number, number]> = [[-118.257363, 34.076763]];

const destinations: Array<[number, number]> = [
  [-118.3417932, 34.00451385],
  [-118.08788, 34.01752],
  [-118.20327, 34.19382],
];

const originsLatLong: ILocation[] = [
  {
    lat: 34.076763,
    long: -118.257363,
  },
];

const destinationsLatLong: ILocation[] = [
  {
    lat: 34.00451385,
    long: -118.3417932,
  },
  {
    lat: 34.01752,
    long: -118.08788,
  },
  {
    lat: 34.19382,
    long: -118.20327,
  },
];

const originsLatitudeLongitude: ILocation[] = [
  {
    latitude: 34.076763,
    longitude: -118.257363,
  },
];

const destinationsLatitudeLongitude: ILocation[] = [
  {
    latitude: 34.00451385,
    longitude: -118.3417932,
  },
  {
    latitude: 34.01752,
    longitude: -118.08788,
  },
  {
    latitude: 34.19382,
    longitude: -118.20327,
  },
];

const originsPoint: IPoint[] = [
  {
    x: -118.257363,
    y: 34.076763,
  },
];

const destinationsPoint: IPoint[] = [
  {
    x: -118.3417932,
    y: 34.00451385,
  },
  {
    x: -118.08788,
    y: 34.01752,
  },
  {
    x: -118.20327,
    y: 34.19382,
  },
];

// optional input params

const barriers: IPoint[] = [
  { x: -117.1957, y: 34.0564 },
  { x: -117.184, y: 34.0546 },
];

const polylineBarriers: IFeatureSet = {
  features: [
    {
      geometry: {
        paths: [
          [
            [-10804823.397, 3873688.372],
            [-10804811.152, 3873025.945],
          ],
        ],
        spatialReference: {
          wkid: 102100,
        },
      } as IPolyline,
      attributes: {
        Name: "Barrier 1",
      },
    },
    {
      geometry: {
        paths: [
          [
            [-10804823.397, 3873688.372],
            [-10804807.813, 3873290.911],
            [-10804811.152, 3873025.945],
          ],
          [
            [-10805032.678, 3863358.76],
            [-10805001.508, 3862829.281],
          ],
        ],
        spatialReference: {
          wkid: 102100,
        },
      } as IPolyline,
      attributes: {
        Name: "Barrier 2",
      },
    },
  ],
};

const polygonBarriers: IFeatureSet = {
  features: [
    {
      geometry: {
        rings: [
          [
            [-97.0634, 32.8442],
            [-97.0554, 32.84],
            [-97.0558, 32.8327],
            [-97.0638, 32.83],
            [-97.0634, 32.8442],
          ],
        ],
      } as IPolygon,
      attributes: {
        Name: "Flood zone",
        BarrierType: 0,
      },
    },
    {
      geometry: {
        rings: [
          [
            [-97.0803, 32.8235],
            [-97.0776, 32.8277],
            [-97.074, 32.8254],
            [-97.0767, 32.8227],
            [-97.0803, 32.8235],
          ],
          [
            [-97.0871, 32.8311],
            [-97.0831, 32.8292],
            [-97.0853, 32.8259],
            [-97.0892, 32.8279],
            [-97.0871, 32.8311],
          ],
        ],
      } as IPolygon,
      attributes: {
        Name: "Severe weather zone",
        BarrierType: 1,
        Attr_TravelTime: 3,
      },
    },
  ],
};

describe("originDestinationMatrix", () => {
  afterEach(fetchMock.restore);

  it("should throw an error when a originDestinationMatrix request is made without a token", (done) => {
    fetchMock.once("*", {});

    originDestinationMatrix({
      origins,
      destinations,
    })
      // tslint:disable-next-line
      .catch((e) => {
        expect(e).toEqual(
          "Calculating the origin-destination cost matrix using the ArcGIS service requires authentication"
        );
        done();
      });
  });

  it("should make a simple originDestinationMatrix request (Point Arrays)", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins,
      destinations,
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(url).toEqual(
          "https://route.arcgis.com/arcgis/rest/services/World/OriginDestinationCostMatrix/NAServer/OriginDestinationCostMatrix_World/solveODCostMatrix"
        );
        expect(options.method).toBe("POST");
        expect(options.body).toContain("f=json");
        expect(options.body).toContain(
          `origins=${encodeURIComponent("-118.257363,34.076763")}`
        );
        expect(options.body).toContain(
          `destinations=${encodeURIComponent(
            "-118.3417932,34.00451385;-118.08788,34.01752;-118.20327,34.19382"
          )}`
        );
        expect(options.body).toContain("token=token");

        expect(response.origins.spatialReference.latestWkid).toEqual(4326);
        expect(response.origins.features.length).toEqual(origins.length);

        expect(response.destinations.spatialReference.latestWkid).toEqual(4326);
        expect(response.destinations.features.length).toEqual(
          destinations.length
        );

        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should pass default values", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins,
      destinations,
      params: {
        outSR: 102100,
      },
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain("outputType=esriNAODOutputSparseMatrix");
        expect(options.body).toContain("returnOrigins=true");
        expect(options.body).toContain("returnDestinations=true");
        expect(options.body).toContain("returnBarriers=true");
        expect(options.body).toContain("returnPolylineBarriers=true");
        expect(options.body).toContain("returnPolygonBarriers=true");
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should allow default values to be overridden", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins,
      destinations,
      outputType: "esriNAODOutputStraightLines",
      returnOrigins: false,
      returnDestinations: false,
      returnBarriers: false,
      returnPolylineBarriers: false,
      returnPolygonBarriers: false,
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(
          "outputType=esriNAODOutputStraightLines"
        );
        expect(options.body).toContain("returnOrigins=false");
        expect(options.body).toContain("returnDestinations=false");
        expect(options.body).toContain("returnBarriers=false");
        expect(options.body).toContain("returnPolylineBarriers=false");
        expect(options.body).toContain("returnPolygonBarriers=false");
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should make a originDestinationMatrix request with a custom endpoint", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins,
      destinations,
      params: {
        outSR: 102100,
      },
      authentication: MOCK_AUTH,
      endpoint: 'https://esri.com/test'
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(url).toEqual(
          "https://esri.com/test/solveODCostMatrix"
        );
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should make a simple originDestinationMatrix request (array of objects - lat/lon)", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: originsLatLong,
      destinations: destinationsLatLong,
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(
          `origins=${encodeURIComponent("-118.257363,34.076763")}`
        );
        expect(options.body).toContain(
          `destinations=${encodeURIComponent(
            "-118.3417932,34.00451385;-118.08788,34.01752;-118.20327,34.19382"
          )}`
        );
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should make a simple originDestinationMatrix request (array of objects - latitude/longitude)", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: originsLatitudeLongitude,
      destinations: destinationsLatitudeLongitude,
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(
          `origins=${encodeURIComponent("-118.257363,34.076763")}`
        );
        expect(options.body).toContain(
          `destinations=${encodeURIComponent(
            "-118.3417932,34.00451385;-118.08788,34.01752;-118.20327,34.19382"
          )}`
        );
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should make a simple originDestinationMatrix request (array of IPoint)", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: originsPoint,
      destinations: destinationsPoint,
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(
          `origins=${encodeURIComponent("-118.257363,34.076763")}`
        );
        expect(options.body).toContain(
          `destinations=${encodeURIComponent(
            "-118.3417932,34.00451385;-118.08788,34.01752;-118.20327,34.19382"
          )}`
        );
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should include proper outputType (esriNAODOutputSparseMatrix)", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: origins,
      destinations: destinations,
      outputType: "esriNAODOutputSparseMatrix",
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(`outputType=esriNAODOutputSparseMatrix`);
        expect(Object.keys(response)).toContain("odCostMatrix");
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should include proper outputType (esriNAODOutputStraightLines)", (done) => {
    fetchMock.once("*", OriginDestinationMatrix_esriNAODOutputStraightLines);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: origins,
      destinations: destinations,
      outputType: "esriNAODOutputStraightLines",
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(
          `outputType=esriNAODOutputStraightLines`
        );
        expect(Object.keys(response)).toContain("odLines");
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should include proper outputType (esriNAODOutputNoLines)", (done) => {
    fetchMock.once("*", OriginDestinationMatrix_esriNAODOutputNoLines);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: origins,
      destinations: destinations,
      outputType: "esriNAODOutputNoLines",
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(`outputType=esriNAODOutputNoLines`);
        expect(Object.keys(response)).toContain("odLines");
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should pass simple barriers", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: origins,
      destinations: destinations,
      barriers,
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(
          `barriers=${encodeURIComponent("-117.1957,34.0564;-117.184,34.0546")}`
        );
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should pass polyline barriers", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: origins,
      destinations: destinations,
      polylineBarriers,
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(
          `polylineBarriers=${encodeURIComponent(
            JSON.stringify(polylineBarriers)
          )}`
        );
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should pass polygon barriers", (done) => {
    fetchMock.once("*", OriginDestinationMatrix);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: origins,
      destinations: destinations,
      polygonBarriers,
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");
        expect(options.body).toContain(
          `polygonBarriers=${encodeURIComponent(
            JSON.stringify(polygonBarriers)
          )}`
        );
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should include geoJson for any geometries in the return", (done) => {
    fetchMock.once("*", OriginDestinationMatrix_AllBarrierTypes);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: origins,
      destinations: destinations,
      barriers: barriers,
      polylineBarriers: polylineBarriers,
      polygonBarriers: polygonBarriers,
      authentication: MOCK_AUTH,
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");

        // origins
        expect(Object.keys(response.origins)).toContain("geoJson");
        expect(Object.keys(response.origins.geoJson)).toContain("type");
        expect(response.origins.geoJson.type).toEqual("FeatureCollection");
        expect(Object.keys(response.origins.geoJson)).toContain("features");
        expect(response.origins.geoJson.features.length).toEqual(
          origins.length
        );

        // destinations
        expect(Object.keys(response.destinations)).toContain("geoJson");
        expect(Object.keys(response.destinations.geoJson)).toContain("type");
        expect(response.destinations.geoJson.type).toEqual("FeatureCollection");
        expect(Object.keys(response.destinations.geoJson)).toContain(
          "features"
        );
        expect(response.destinations.geoJson.features.length).toEqual(
          destinations.length
        );

        // barriers
        expect(Object.keys(response.barriers)).toContain("geoJson");
        expect(Object.keys(response.barriers.geoJson)).toContain("type");
        expect(response.barriers.geoJson.type).toEqual("FeatureCollection");
        expect(Object.keys(response.barriers.geoJson)).toContain("features");
        expect(response.barriers.geoJson.features.length).toEqual(
          barriers.length
        );

        // polylineBarriers
        expect(Object.keys(response.polylineBarriers)).toContain("geoJson");
        expect(Object.keys(response.polylineBarriers.geoJson)).toContain(
          "type"
        );
        expect(response.polylineBarriers.geoJson.type).toEqual(
          "FeatureCollection"
        );
        expect(Object.keys(response.polylineBarriers.geoJson)).toContain(
          "features"
        );
        expect(response.polylineBarriers.geoJson.features.length).toEqual(
          polylineBarriers.features.length
        );

        // polygonBarriers
        expect(Object.keys(response.polygonBarriers)).toContain("geoJson");
        expect(Object.keys(response.polygonBarriers.geoJson)).toContain("type");
        expect(response.polygonBarriers.geoJson.type).toEqual(
          "FeatureCollection"
        );
        expect(Object.keys(response.polygonBarriers.geoJson)).toContain(
          "features"
        );
        expect(response.polygonBarriers.geoJson.features.length).toEqual(
          polygonBarriers.features.length
        );

        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should not include routes.geoJson in the return for non-4326", (done) => {
    fetchMock.once("*", OriginDestinationMatrix_AllBarrierTypes_WebMercator);

    const MOCK_AUTH = {
      getToken() {
        return Promise.resolve("token");
      },
      portal: "https://mapsdev.arcgis.com",
    };

    originDestinationMatrix({
      origins: origins,
      destinations: destinations,
      barriers: barriers,
      polylineBarriers: polylineBarriers,
      polygonBarriers: polygonBarriers,
      authentication: MOCK_AUTH,
      params: {
        outSR: 102100,
      },
    })
      .then((response) => {
        expect(fetchMock.called()).toEqual(true);
        const [url, options]: [string, RequestInit] = fetchMock.lastCall("*");

        // origins
        expect(Object.keys(response.origins)).not.toContain("geoJson");

        // destinations
        expect(Object.keys(response.destinations)).not.toContain("geoJson");

        // barriers
        expect(Object.keys(response.barriers)).not.toContain("geoJson");

        // polylineBarriers
        expect(Object.keys(response.polylineBarriers)).not.toContain("geoJson");

        // polygonBarriers
        expect(Object.keys(response.polygonBarriers)).not.toContain("geoJson");

        done();
      })
      .catch((e) => {
        fail(e);
      });
  });
});
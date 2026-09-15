const express = require("express");
const request = require("supertest");

const { createPropertiesRouter } = require("../routes/properties");

const sampleProperty = {
  L_ListingID: "1001",
  L_Address: "100 Test Street",
  L_City: "Manteca",
  L_State: "CA",
  L_SystemPrice: 500000,
};

function createApp(pool) {
  const app = express();

  app.use(express.json());
  app.use("/api/properties", createPropertiesRouter(pool));

  return app;
}

function createPool(handler) {
  const queries = [];

  return {
    queries,
    query: jest.fn(async (sql, values) => {
      queries.push({ sql, values });
      return handler(sql, values, queries.length);
    }),
  };
}

describe("properties routes", () => {
  test("GET /api/properties returns paginated results with a total count", async () => {
    const pool = createPool((sql) => {
      if (sql.startsWith("SELECT COUNT")) {
        return [[{ total: 2 }]];
      }

      return [[sampleProperty]];
    });

    const response = await request(createApp(pool))
      .get("/api/properties")
      .query({ limit: 10, offset: 20 })
      .expect(200);

    expect(response.body).toEqual({
      total: 2,
      limit: 10,
      offset: 20,
      results: [sampleProperty],
    });
    expect(pool.queries[1].values).toEqual([10, 20]);
  });

  test("GET /api/properties applies every supported filter type", async () => {
    const pool = createPool((sql) => {
      if (sql.startsWith("SELECT COUNT")) {
        return [[{ total: 1 }]];
      }

      return [[sampleProperty]];
    });

    await request(createApp(pool))
      .get("/api/properties")
      .query({
        city: "Manteca",
        zipcode: "95336",
        minPrice: "300000",
        maxPrice: "700000",
        beds: "3",
        baths: "2",
        limit: "5",
        offset: "0",
      })
      .expect(200);

    expect(pool.queries[0].sql).toMatch(/LOWER\(TRIM\(`L_City`\)\)/);
    expect(pool.queries[0].sql).toMatch(/`L_Zip` = \?/);
    expect(pool.queries[0].sql).toMatch(/`L_SystemPrice` >= \?/);
    expect(pool.queries[0].sql).toMatch(/`L_SystemPrice` <= \?/);
    expect(pool.queries[0].sql).toMatch(/`L_Keyword2` >= \?/);
    expect(pool.queries[0].sql).toMatch(/`LM_Dec_3` >= \?/);
    expect(pool.queries[0].values).toEqual([
      "Manteca",
      "95336",
      300000,
      700000,
      3,
      2,
    ]);
    expect(pool.queries[1].values).toEqual([
      "Manteca",
      "95336",
      300000,
      700000,
      3,
      2,
      5,
      0,
    ]);
  });

  test("GET /api/properties supports city price sorting after fresh SQL imports", async () => {
    const pool = createPool((sql) => {
      if (sql.startsWith("SELECT COUNT")) {
        return [[{ total: 1 }]];
      }

      return [[sampleProperty]];
    });

    const response = await request(createApp(pool))
      .get("/api/properties")
      .query({
        city: "Beverly Hills",
        minPrice: "300000",
        maxPrice: "1000000",
        sortBy: "price",
        sortOrder: "asc",
      })
      .expect(200);

    expect(response.body.results).toEqual([sampleProperty]);
    expect(pool.queries[1].sql).toMatch(/ORDER BY `L_SystemPrice` ASC/);
    expect(pool.queries[1].sql).not.toMatch(/FORCE INDEX/);
    expect(pool.queries[1].values).toEqual([
      "Beverly Hills",
      300000,
      1000000,
      20,
      0,
    ]);
  });

  test("GET /api/properties rejects invalid inputs with 400", async () => {
    const pool = createPool(() => {
      throw new Error("database should not be called for invalid input");
    });
    const app = createApp(pool);

    const badPrice = await request(app).get("/api/properties?minPrice=abc").expect(400);
    const badLimit = await request(app).get("/api/properties?limit=0").expect(400);
    const badSort = await request(app).get("/api/properties?sortBy=badField").expect(400);

    expect(badPrice.body.error).toMatch(/minPrice/);
    expect(badLimit.body.error).toMatch(/limit/);
    expect(badSort.body.error).toMatch(/sortBy/);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("GET /api/properties/:id returns one property, 404, or 400", async () => {
    const pool = createPool((sql, values) => {
      if (values[0] === "missing") {
        return [[]];
      }

      return [[sampleProperty]];
    });
    const app = createApp(pool);

    const found = await request(app).get("/api/properties/1001").expect(200);
    const missing = await request(app).get("/api/properties/missing").expect(404);
    const invalid = await request(app).get("/api/properties/bad%2Fid").expect(400);

    expect(found.body.L_ListingID).toBe("1001");
    expect(missing.body.error).toMatch(/not found/);
    expect(invalid.body.error).toMatch(/may only contain/);
  });

  test("GET /api/properties/:id/openhouses returns events, empty arrays, or 404", async () => {
    const openHouse = {
      L_ListingID: "1001",
      OpenHouseDate: "2026-09-05",
      OH_StartTime: "13:00:00",
    };
    const pool = createPool((sql, values) => {
      if (sql.includes("FROM rets_property") && values[0] === "missing") {
        return [[]];
      }

      if (sql.includes("FROM rets_property")) {
        return [[{ L_ListingID: values[0] }]];
      }

      if (values[0] === "empty") {
        return [[]];
      }

      return [[openHouse]];
    });
    const app = createApp(pool);

    const success = await request(app).get("/api/properties/1001/openhouses").expect(200);
    const empty = await request(app).get("/api/properties/empty/openhouses").expect(200);
    const missing = await request(app).get("/api/properties/missing/openhouses").expect(404);

    expect(success.body).toEqual([openHouse]);
    expect(empty.body).toEqual([]);
    expect(missing.body.error).toMatch(/not found/);
  });
});

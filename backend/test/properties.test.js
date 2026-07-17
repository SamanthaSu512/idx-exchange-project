const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildOpenHousesByPropertyIdQuery,
  buildPropertyByIdQuery,
  buildPropertiesQuery,
  getOpenHousesByPropertyIdResult,
  validateListingId,
} = require("../routes/properties");

test("builds default paginated property query", () => {
  const query = buildPropertiesQuery({});

  assert.equal(query.limit, 20);
  assert.equal(query.offset, 0);
  assert.equal(query.countSql, "SELECT COUNT(*) AS total FROM rets_property");
  assert.equal(query.dataSql, "SELECT * FROM rets_property LIMIT ? OFFSET ?");
  assert.deepEqual(query.countValues, []);
  assert.deepEqual(query.dataValues, [20, 0]);
});

test("keeps combined minPrice and beds values aligned with placeholders", () => {
  const query = buildPropertiesQuery({
    city: "Portland",
    minPrice: "300000",
    beds: "3",
    limit: "20",
    offset: "0",
  });

  assert.match(query.countSql, /LOWER\(TRIM\(`L_City`\)\) = LOWER\(TRIM\(\?\)\)/);
  assert.match(query.countSql, /`L_SystemPrice` >= \?/);
  assert.match(query.countSql, /`L_Keyword2` >= \?/);
  assert.deepEqual(query.countValues, ["Portland", 300000, 3]);
  assert.deepEqual(query.dataValues, ["Portland", 300000, 3, 20, 0]);
});

test("builds multi-filter query without string-concatenating user values", () => {
  const query = buildPropertiesQuery({
    city: "Portland",
    zipcode: "97201",
    minPrice: "300000",
    maxPrice: "800000",
    beds: "3",
    baths: "2",
    limit: "10",
    offset: "20",
  });

  assert.equal((query.countSql.match(/\?/g) || []).length, 6);
  assert.deepEqual(query.countValues, [
    "Portland",
    "97201",
    300000,
    800000,
    3,
    2,
  ]);
  assert.deepEqual(query.dataValues, [
    "Portland",
    "97201",
    300000,
    800000,
    3,
    2,
    10,
    20,
  ]);
});

test("rejects invalid query parameters with helpful messages", () => {
  assert.throws(
    () => buildPropertiesQuery({ minPrice: "abc" }),
    /minPrice must be a valid non-negative price/
  );
  assert.throws(
    () => buildPropertiesQuery({ limit: "0" }),
    /limit must be at least 1/
  );
  assert.throws(
    () => buildPropertiesQuery({ limit: "200" }),
    /limit must be no greater than 100/
  );
});

test("builds property detail query by listing ID", () => {
  const query = buildPropertyByIdQuery("1174572339");

  assert.equal(
    query.sql,
    "SELECT * FROM rets_property WHERE L_ListingID = ? LIMIT 1"
  );
  assert.deepEqual(query.values, ["1174572339"]);
});

test("builds open houses query after validating property existence", () => {
  const query = buildOpenHousesByPropertyIdQuery("1174572339");

  assert.equal(
    query.propertySql,
    "SELECT L_ListingID FROM rets_property WHERE L_ListingID = ? LIMIT 1"
  );
  assert.deepEqual(query.propertyValues, ["1174572339"]);
  assert.match(query.openHousesSql, /FROM rets_openhouse/);
  assert.match(query.openHousesSql, /WHERE L_ListingID = \?/);
  assert.match(query.openHousesSql, /ORDER BY OpenHouseDate ASC, OH_StartTime ASC/);
  assert.deepEqual(query.openHousesValues, ["1174572339"]);
});

test("validates malformed and oversized listing IDs", () => {
  assert.equal(validateListingId(" 1174572339 "), "1174572339");
  assert.throws(
    () => validateListingId("abc/123"),
    /listing ID may only contain/
  );
  assert.throws(
    () => validateListingId("x".repeat(65)),
    /listing ID must be 64 characters or fewer/
  );
});

test("open houses route handles rejected database promises", async () => {
  const pool = {
    query: async (sql) => {
      if (sql.includes("FROM rets_property")) {
        return [[{ L_ListingID: "1174572339" }]];
      }

      throw new Error("bad open house row");
    },
  };
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const result = await getOpenHousesByPropertyIdResult(pool, "1174572339");

    assert.equal(result.status, 500);
    assert.equal(result.body.error, "Failed to load open houses");
  } finally {
    console.error = originalConsoleError;
  }
});

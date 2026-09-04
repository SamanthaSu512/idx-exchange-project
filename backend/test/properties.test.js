const {
  buildOpenHousesByPropertyIdQuery,
  buildPropertyByIdQuery,
  buildPropertiesQuery,
  getOpenHousesByPropertyIdResult,
  validateListingId,
} = require("../routes/properties");

describe("property query builders", () => {
  test("builds default paginated property query", () => {
    const query = buildPropertiesQuery({});

    expect(query.limit).toBe(20);
    expect(query.offset).toBe(0);
    expect(query.countSql).toBe("SELECT COUNT(*) AS total FROM rets_property");
    expect(query.dataSql).toBe("SELECT * FROM rets_property LIMIT ? OFFSET ?");
    expect(query.countValues).toEqual([]);
    expect(query.dataValues).toEqual([20, 0]);
  });

  test("keeps combined minPrice and beds values aligned with placeholders", () => {
    const query = buildPropertiesQuery({
      city: "Portland",
      minPrice: "300000",
      beds: "3",
      limit: "20",
      offset: "0",
    });

    expect(query.countSql).toMatch(/LOWER\(TRIM\(`L_City`\)\) = LOWER\(TRIM\(\?\)\)/);
    expect(query.countSql).toMatch(/`L_SystemPrice` >= \?/);
    expect(query.countSql).toMatch(/`L_Keyword2` >= \?/);
    expect(query.countValues).toEqual(["Portland", 300000, 3]);
    expect(query.dataValues).toEqual(["Portland", 300000, 3, 20, 0]);
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

    expect(query.countSql.match(/\?/g) || []).toHaveLength(6);
    expect(query.countValues).toEqual([
      "Portland",
      "97201",
      300000,
      800000,
      3,
      2,
    ]);
    expect(query.dataValues).toEqual([
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

  test("builds sorted property queries with whitelisted SQL columns", () => {
    const priceLowToHigh = buildPropertiesQuery({
      sortBy: "price",
      sortOrder: "asc",
    });
    const priceHighToLow = buildPropertiesQuery({
      sortBy: "price",
      sortOrder: "desc",
    });
    const dateListed = buildPropertiesQuery({
      sortBy: "dateListed",
      sortOrder: "desc",
    });

    expect(priceLowToHigh.dataSql).toMatch(
      /FORCE INDEX \(`idx_rets_property_price_beds`\).*ORDER BY `L_SystemPrice` ASC, L_ListingID ASC LIMIT \? OFFSET \?/
    );
    expect(priceHighToLow.dataSql).toMatch(
      /FORCE INDEX \(`idx_rets_property_price_beds`\).*ORDER BY `L_SystemPrice` DESC, L_ListingID ASC LIMIT \? OFFSET \?/
    );
    expect(dateListed.dataSql).toMatch(
      /FORCE INDEX \(`idx_rets_property_listing_contract_date`\).*ORDER BY `ListingContractDate` DESC, L_ListingID ASC LIMIT \? OFFSET \?/
    );
  });

  test("uses the city plus price composite index for city price sorting", () => {
    const query = buildPropertiesQuery({
      city: "Beverly Hills",
      sortBy: "price",
      sortOrder: "asc",
    });

    expect(query.dataSql).toMatch(
      /FORCE INDEX \(`idx_rets_property_city_price_listingid`\).*ORDER BY `L_SystemPrice` ASC/
    );
    expect(query.dataValues).toEqual(["Beverly Hills", 20, 0]);
  });

  test("rejects invalid query parameters with helpful messages", () => {
    expect(() => buildPropertiesQuery({ minPrice: "abc" })).toThrow(
      /minPrice must be a valid non-negative price/
    );
    expect(() => buildPropertiesQuery({ limit: "0" })).toThrow(/limit must be at least 1/);
    expect(() => buildPropertiesQuery({ limit: "200" })).toThrow(
      /limit must be no greater than 100/
    );
    expect(() => buildPropertiesQuery({ sortBy: "DROP TABLE rets_property" })).toThrow(
      /sortBy must be one of/
    );
    expect(() => buildPropertiesQuery({ sortBy: "price", sortOrder: "sideways" })).toThrow(
      /sortOrder must be asc or desc/
    );
  });

  test("builds property detail query by listing ID", () => {
    const query = buildPropertyByIdQuery("1174572339");

    expect(query.sql).toBe("SELECT * FROM rets_property WHERE L_ListingID = ? LIMIT 1");
    expect(query.values).toEqual(["1174572339"]);
  });

  test("builds open houses query after validating property existence", () => {
    const query = buildOpenHousesByPropertyIdQuery("1174572339");

    expect(query.propertySql).toBe(
      "SELECT L_ListingID FROM rets_property WHERE L_ListingID = ? LIMIT 1"
    );
    expect(query.propertyValues).toEqual(["1174572339"]);
    expect(query.openHousesSql).toMatch(/FROM rets_openhouse/);
    expect(query.openHousesSql).toMatch(/WHERE L_ListingID = \?/);
    expect(query.openHousesSql).toMatch(/ORDER BY OpenHouseDate ASC, OH_StartTime ASC/);
    expect(query.openHousesValues).toEqual(["1174572339"]);
  });

  test("validates malformed and oversized listing IDs", () => {
    expect(validateListingId(" 1174572339 ")).toBe("1174572339");
    expect(() => validateListingId("abc/123")).toThrow(/listing ID may only contain/);
    expect(() => validateListingId("x".repeat(65))).toThrow(
      /listing ID must be 64 characters or fewer/
    );
  });

  test("open houses route handles rejected database promises", async () => {
    const pool = {
      query: jest.fn(async (sql) => {
        if (sql.includes("FROM rets_property")) {
          return [[{ L_ListingID: "1174572339" }]];
        }

        throw new Error("bad open house row");
      }),
    };
    const originalConsoleError = console.error;
    console.error = jest.fn();

    try {
      const result = await getOpenHousesByPropertyIdResult(pool, "1174572339");

      expect(result.status).toBe(500);
      expect(result.body.error).toBe("Failed to load open houses");
    } finally {
      console.error = originalConsoleError;
    }
  });
});

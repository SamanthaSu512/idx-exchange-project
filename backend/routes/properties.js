const express = require("express");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_LISTING_ID_LENGTH = 64;

const columns = {
  city: process.env.PROPERTY_CITY_COLUMN || "L_City",
  zipcode: process.env.PROPERTY_ZIPCODE_COLUMN || "L_Zip",
  price: process.env.PROPERTY_PRICE_COLUMN || "L_SystemPrice",
  beds: process.env.PROPERTY_BEDS_COLUMN || "L_Keyword2",
  baths: process.env.PROPERTY_BATHS_COLUMN || "LM_Dec_3",
};

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SORT_COLUMNS = {
  price: "L_SystemPrice",
  dateListed: "ListingContractDate",
  sqft: "LM_Int2_3",
  beds: "L_Keyword2",
};
const SORT_INDEXES = {
  price: "idx_rets_property_price_beds",
  dateListed: "idx_rets_property_listing_contract_date",
  sqft: "idx_rets_property_sqft_listingid",
  beds: "idx_rets_property_beds_listingid",
};
const SORT_ORDERS = new Set(["asc", "desc"]);

function quoteIdentifier(identifier) {
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(`Invalid database column configured: ${identifier}`);
  }

  return `\`${identifier}\``;
}

const quotedColumns = Object.fromEntries(
  Object.entries(columns).map(([key, value]) => [key, quoteIdentifier(value)])
);
const quotedSortColumns = Object.fromEntries(
  Object.entries(SORT_COLUMNS).map(([key, value]) => [key, quoteIdentifier(value)])
);

function parseInteger(value, name, { min, max } = {}) {
  if (value === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(String(value))) {
    throw new Error(`${name} must be a whole number`);
  }

  const parsed = Number(value);

  if (min !== undefined && parsed < min) {
    throw new Error(`${name} must be at least ${min}`);
  }

  if (max !== undefined && parsed > max) {
    throw new Error(`${name} must be no greater than ${max}`);
  }

  return parsed;
}

function parseMoney(value, name) {
  if (value === undefined) {
    return undefined;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) {
    throw new Error(`${name} must be a valid non-negative price`);
  }

  return Number(value);
}

function parseString(value, name) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = String(value).trim();

  if (!parsed) {
    throw new Error(`${name} cannot be empty`);
  }

  return parsed;
}

function parseSortBy(value) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = String(value).trim();

  if (!Object.prototype.hasOwnProperty.call(SORT_COLUMNS, parsed)) {
    throw new Error(
      `sortBy must be one of: ${Object.keys(SORT_COLUMNS).join(", ")}`
    );
  }

  return parsed;
}

function parseSortOrder(value) {
  if (value === undefined) {
    return "asc";
  }

  const parsed = String(value).trim().toLowerCase();

  if (!SORT_ORDERS.has(parsed)) {
    throw new Error("sortOrder must be asc or desc");
  }

  return parsed;
}

function validateListingId(value) {
  const listingId = String(value || "").trim();

  if (!listingId) {
    throw new Error("listing ID is required");
  }

  if (listingId.length > MAX_LISTING_ID_LENGTH) {
    throw new Error(`listing ID must be ${MAX_LISTING_ID_LENGTH} characters or fewer`);
  }

  if (!/^[A-Za-z0-9_-]+$/.test(listingId)) {
    throw new Error("listing ID may only contain letters, numbers, underscores, or hyphens");
  }

  return listingId;
}

function validateQuery(query) {
  const limit = parseInteger(query.limit, "limit", {
    min: 1,
    max: MAX_LIMIT,
  }) ?? DEFAULT_LIMIT;
  const offset = parseInteger(query.offset, "offset", { min: 0 }) ?? 0;
  const minPrice = parseMoney(query.minPrice, "minPrice");
  const maxPrice = parseMoney(query.maxPrice, "maxPrice");

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new Error("minPrice must be less than or equal to maxPrice");
  }

  return {
    city: parseString(query.city, "city"),
    zipcode: parseString(query.zipcode, "zipcode"),
    minPrice,
    maxPrice,
    beds: parseInteger(query.beds, "beds", { min: 0 }),
    baths: parseInteger(query.baths, "baths", { min: 0 }),
    sortBy: parseSortBy(query.sortBy),
    sortOrder: parseSortOrder(query.sortOrder),
    limit,
    offset,
  };
}

function buildWhereClause(filters) {
  const conditions = [];
  const values = [];

  if (filters.city !== undefined) {
    conditions.push(`LOWER(TRIM(${quotedColumns.city})) = LOWER(TRIM(?))`);
    values.push(filters.city);
  }

  if (filters.zipcode !== undefined) {
    conditions.push(`${quotedColumns.zipcode} = ?`);
    values.push(filters.zipcode);
  }

  if (filters.minPrice !== undefined) {
    conditions.push(`${quotedColumns.price} >= ?`);
    values.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(`${quotedColumns.price} <= ?`);
    values.push(filters.maxPrice);
  }

  if (filters.beds !== undefined) {
    conditions.push(`${quotedColumns.beds} >= ?`);
    values.push(filters.beds);
  }

  if (filters.baths !== undefined) {
    conditions.push(`${quotedColumns.baths} >= ?`);
    values.push(filters.baths);
  }

  return {
    sql: conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

function buildOrderClause(filters) {
  if (!filters.sortBy) {
    return "";
  }

  const direction = filters.sortOrder === "desc" ? "DESC" : "ASC";

  return ` ORDER BY ${quotedSortColumns[filters.sortBy]} ${direction}, L_ListingID ASC`;
}

function buildIndexHint(filters) {
  if (!filters.sortBy) {
    return "";
  }

  if (filters.city !== undefined && filters.sortBy === "price") {
    return " FORCE INDEX (`idx_rets_property_city_price_listingid`)";
  }

  return ` FORCE INDEX (\`${SORT_INDEXES[filters.sortBy]}\`)`;
}

function buildPropertiesQuery(rawQuery) {
  const filters = validateQuery(rawQuery);
  const where = buildWhereClause(filters);
  const order = buildOrderClause(filters);
  const indexHint = buildIndexHint(filters);
  const countSql = `SELECT COUNT(*) AS total FROM rets_property${where.sql}`;
  const dataSql = `SELECT * FROM rets_property${indexHint}${where.sql}${order} LIMIT ? OFFSET ?`;

  return {
    countSql,
    countValues: [...where.values],
    dataSql,
    dataValues: [...where.values, filters.limit, filters.offset],
    limit: filters.limit,
    offset: filters.offset,
  };
}

function buildPropertyByIdQuery(rawListingId) {
  const listingId = validateListingId(rawListingId);

  return {
    sql: "SELECT * FROM rets_property WHERE L_ListingID = ? LIMIT 1",
    values: [listingId],
    listingId,
  };
}

function buildOpenHousesByPropertyIdQuery(rawListingId) {
  const listingId = validateListingId(rawListingId);

  return {
    propertySql: "SELECT L_ListingID FROM rets_property WHERE L_ListingID = ? LIMIT 1",
    propertyValues: [listingId],
    openHousesSql: `
      SELECT *
      FROM rets_openhouse
      WHERE L_ListingID = ?
      ORDER BY OpenHouseDate ASC, OH_StartTime ASC
    `,
    openHousesValues: [listingId],
    listingId,
  };
}

async function getPropertyByIdResult(pool, rawListingId) {
  let query;

  try {
    query = buildPropertyByIdQuery(rawListingId);
  } catch (error) {
    return { status: 400, body: { error: error.message } };
  }

  try {
    const [properties] = await pool.query(query.sql, query.values);

    if (!properties.length) {
      return {
        status: 404,
        body: { error: `Property ${query.listingId} was not found` },
      };
    }

    return { status: 200, body: properties[0] };
  } catch (error) {
    console.error("Property lookup failed:", error.message);

    return {
      status: 500,
      body: { error: "Failed to load property" },
    };
  }
}

async function getOpenHousesByPropertyIdResult(pool, rawListingId) {
  let query;

  try {
    query = buildOpenHousesByPropertyIdQuery(rawListingId);
  } catch (error) {
    return { status: 400, body: { error: error.message } };
  }

  try {
    const [properties] = await pool.query(query.propertySql, query.propertyValues);

    if (!properties.length) {
      return {
        status: 404,
        body: { error: `Property ${query.listingId} was not found` },
      };
    }

    const [openHouses] = await pool.query(
      query.openHousesSql,
      query.openHousesValues
    );

    return { status: 200, body: openHouses };
  } catch (error) {
    console.error("Open house lookup failed:", error.message);

    return {
      status: 500,
      body: { error: "Failed to load open houses" },
    };
  }
}

function createPropertiesRouter(pool) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    let query;

    try {
      query = buildPropertiesQuery(req.query);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    try {
      const [[countRow]] = await pool.query(query.countSql, query.countValues);
      const [results] = await pool.query(query.dataSql, query.dataValues);

      return res.json({
        total: Number(countRow.total),
        limit: query.limit,
        offset: query.offset,
        results,
      });
    } catch (error) {
      console.error("Property search failed:", error.message);

      return res.status(500).json({
        error: "Failed to search properties",
      });
    }
  });

  router.get("/:id/openhouses", async (req, res) => {
    const result = await getOpenHousesByPropertyIdResult(pool, req.params.id);

    return res.status(result.status).json(result.body);
  });

  router.get("/:id", async (req, res) => {
    const result = await getPropertyByIdResult(pool, req.params.id);

    return res.status(result.status).json(result.body);
  });

  return router;
}

module.exports = {
  buildOpenHousesByPropertyIdQuery,
  buildPropertyByIdQuery,
  buildPropertiesQuery,
  createPropertiesRouter,
  getOpenHousesByPropertyIdResult,
  getPropertyByIdResult,
  validateListingId,
};

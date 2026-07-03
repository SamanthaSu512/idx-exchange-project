const express = require("express");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const columns = {
  city: process.env.PROPERTY_CITY_COLUMN || "L_City",
  zipcode: process.env.PROPERTY_ZIPCODE_COLUMN || "L_Zip",
  price: process.env.PROPERTY_PRICE_COLUMN || "L_SystemPrice",
  beds: process.env.PROPERTY_BEDS_COLUMN || "L_Keyword2",
  baths: process.env.PROPERTY_BATHS_COLUMN || "LM_Dec_3",
};

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function quoteIdentifier(identifier) {
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(`Invalid database column configured: ${identifier}`);
  }

  return `\`${identifier}\``;
}

const quotedColumns = Object.fromEntries(
  Object.entries(columns).map(([key, value]) => [key, quoteIdentifier(value)])
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

function buildPropertiesQuery(rawQuery) {
  const filters = validateQuery(rawQuery);
  const where = buildWhereClause(filters);
  const countSql = `SELECT COUNT(*) AS total FROM rets_property${where.sql}`;
  const dataSql = `SELECT * FROM rets_property${where.sql} LIMIT ? OFFSET ?`;

  return {
    countSql,
    countValues: [...where.values],
    dataSql,
    dataValues: [...where.values, filters.limit, filters.offset],
    limit: filters.limit,
    offset: filters.offset,
  };
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

  return router;
}

module.exports = {
  buildPropertiesQuery,
  createPropertiesRouter,
};

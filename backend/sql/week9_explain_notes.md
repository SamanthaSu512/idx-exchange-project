# Week 9 EXPLAIN Notes

## Query Tested

Most complex filter plus sort:

```sql
EXPLAIN
SELECT *
FROM rets_property FORCE INDEX (`idx_rets_property_city_price_listingid`)
WHERE LOWER(TRIM(L_City)) = LOWER(TRIM(?))
  AND L_SystemPrice >= ?
  AND L_SystemPrice <= ?
  AND L_Keyword2 >= ?
  AND LM_Dec_3 >= ?
ORDER BY L_SystemPrice ASC, L_ListingID ASC
LIMIT ? OFFSET ?;
```

Values used:

```text
Beverly Hills, 300000, 5000000, 3, 2, 20, 0
```

## EXPLAIN Result Before Week 9 Optimization

This was the EXPLAIN result for the same complex query before adding the Week 9
city/price index hint:

| id | select_type | table | type | possible_keys | key | key_len | ref | rows | filtered | Extra |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| 1 | SIMPLE | rets_property | range | idx_rets_property_price_beds, idx_rets_property_baths, idx_rets_property_city_normalized_price_beds | idx_rets_property_city_normalized_price_beds | 213 | NULL | 116 | 16.66 | Using where; Using filesort |

Important finding:

```text
key: idx_rets_property_city_normalized_price_beds
rows: 116
Extra: Using where; Using filesort
```

MySQL was using an index, but `Using filesort` meant it still had to do extra
sorting work for the `ORDER BY L_SystemPrice ASC, L_ListingID ASC` part.

## EXPLAIN Result After Week 9 Optimization

```text
EXPLAIN
SELECT *
FROM rets_property FORCE INDEX (`idx_rets_property_city_price_listingid`)
WHERE LOWER(TRIM(L_City)) = LOWER(TRIM(?))
  AND L_SystemPrice >= ?
  AND L_SystemPrice <= ?
  AND L_Keyword2 >= ?
  AND LM_Dec_3 >= ?
ORDER BY L_SystemPrice ASC, L_ListingID ASC
LIMIT ? OFFSET ?;
```

Full EXPLAIN output:

| id | select_type | table | type | possible_keys | key | key_len | ref | rows | filtered | Extra |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| 1 | SIMPLE | rets_property | range | idx_rets_property_city_price_listingid | idx_rets_property_city_price_listingid | 208 | NULL | 1 | 11.11 | Using where |

Important result:

```text
key: idx_rets_property_city_price_listingid
rows: 1
Extra: Using where
```

After adding `idx_rets_property_city_price_listingid`, the optimized demo query
uses the new index and no longer reports `Using filesort`.

## What The Important EXPLAIN Columns Mean

- `id`: The SELECT identifier. This query has one simple SELECT, so it is `1`.
- `select_type`: `SIMPLE` means there are no subqueries or UNIONs.
- `table`: The table MySQL reads, here `rets_property`.
- `type`: Access method. `range` is good here because MySQL scans a bounded
  index range instead of every row.
- `possible_keys`: Indexes MySQL could use.
- `key`: The index MySQL actually chose. For the optimized query this is
  `idx_rets_property_city_price_listingid`, so the index is being used.
- `key_len`: How many bytes of the index MySQL uses.
- `ref`: Which value or column is compared against the index. It is `NULL` for
  this range scan.
- `rows`: Estimated rows MySQL expects to examine.
- `filtered`: Estimated percentage of rows that pass the remaining filters.
- `Extra`: Additional work. `Using where` is expected because not every filter
  column is in this index. Avoiding `Using filesort` is the important
  improvement for the sorted demo query.

## Indexes Added

```sql
CREATE INDEX idx_rets_property_city_price_listingid
  ON rets_property ((LOWER(TRIM(L_City))), L_SystemPrice, L_ListingID);

CREATE INDEX idx_rets_property_listing_contract_date
  ON rets_property (ListingContractDate, L_ListingID);

CREATE INDEX idx_rets_property_sqft_listingid
  ON rets_property (LM_Int2_3, L_ListingID);

CREATE INDEX idx_rets_property_beds_listingid
  ON rets_property (L_Keyword2, L_ListingID);
```

The date, square-footage, and beds indexes support Week 9 sorting controls.
Covering EXPLAIN checks for those indexed columns show `type: index` and
`Using index`, confirming the B-tree can serve sorted reads.

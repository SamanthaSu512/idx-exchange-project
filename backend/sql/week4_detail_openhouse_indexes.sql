CREATE INDEX idx_rets_property_listing_id
  ON rets_property (L_ListingID);

CREATE INDEX idx_rets_openhouse_listing_date_time
  ON rets_openhouse (L_ListingID, OpenHouseDate, OH_StartTime);

SET SESSION sql_mode = '';

CREATE INDEX idx_rets_property_city_price_listingid
  ON rets_property ((LOWER(TRIM(L_City))), L_SystemPrice, L_ListingID);

CREATE INDEX idx_rets_property_listing_contract_date
  ON rets_property (ListingContractDate, L_ListingID);

CREATE INDEX idx_rets_property_sqft_listingid
  ON rets_property (LM_Int2_3, L_ListingID);

CREATE INDEX idx_rets_property_beds_listingid
  ON rets_property (L_Keyword2, L_ListingID);

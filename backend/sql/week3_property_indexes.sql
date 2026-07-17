CREATE INDEX idx_rets_property_city_normalized_price_beds
  ON rets_property ((LOWER(TRIM(L_City))), L_SystemPrice, L_Keyword2);

CREATE INDEX idx_rets_property_price_beds
  ON rets_property (L_SystemPrice, L_Keyword2);

CREATE INDEX idx_rets_property_zipcode
  ON rets_property (L_Zip);

CREATE INDEX idx_rets_property_baths
  ON rets_property (LM_Dec_3);

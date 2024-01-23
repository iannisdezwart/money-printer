type AssetConfigurationAsset = {
  id: string;
  source: string;
  symbol: string;
  qtyDecimals: number;
  priceDecimals: number;
};

export type AssetConfiguration = {
  assets: AssetConfigurationAsset[];
};

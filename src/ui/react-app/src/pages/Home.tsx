import { useState } from "react";
import { Link } from "react-router-dom";
import { styled } from "styled-components";
import { search } from "../../util/search.js";

const BorderedDiv = styled.div`
  border: 1px solid blue;
  margin: 8px;
  padding: 8px;
`;

export const Home = () => {
  const [marketDataAssetId, setMarketDataAssetId] = useState("");
  const [maxSpread, setMaxSpread] = useState("");

  return (
    <>
      <h1>MoneyPrinter</h1>
      <BorderedDiv>
        <h3>Market Data</h3>
        <br />
        Asset ID
        <input
          type="text"
          value={marketDataAssetId}
          onChange={(evt) => setMarketDataAssetId(evt.target.value)}
        />
        <br />
        Max Spread
        <input
          type="text"
          value={maxSpread}
          onChange={(evt) => setMaxSpread(evt.target.value)}
        />
        <br />
        <Link
          to={{
            pathname: "/market-data",
            search: search({
              assetId: marketDataAssetId,
              maxSpread,
            }),
          }}
        >
          Go
        </Link>
      </BorderedDiv>
    </>
  );
};

import ReactDOM from "react-dom";
import {
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import { Home } from "./pages/Home.js";
import { MarketData } from "./pages/MarketData.js";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/market-data",
    element: <MarketData />,
  },
]);

ReactDOM.render(
  <RouterProvider router={router} />,
  document.getElementById("root")
);

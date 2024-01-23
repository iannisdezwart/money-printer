import HtmlWebpackPlugin from "html-webpack-plugin";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";

const dev = process.env.NODE_ENV !== "production";

export const mode = process.env.NODE_ENV;
export const devtool = dev ? "inline-source-map" : undefined;
export const entry = [
  join(dirname(fileURLToPath(import.meta.url)), "src", "index.js"),
];
export const output = {
  path: resolve(dirname(fileURLToPath(import.meta.url)), "www"),
  filename: "bundle.[contenthash].js",
  clean: true,
  publicPath: "/",
};
export const module = {
  rules: [
    {
      test: /\.js|\.jsx$/,
      exclude: /node_modules/,
      include: resolve(dirname(fileURLToPath(import.meta.url)), "src"),
      use: "babel-loader",
    },
    {
      test: /\.(png|jpe?g|gif|webp)$/i,
      use: {
        loader: "url-loader",
        options: {
          limit: 8192,
          name: "static/media/[name].[contenthash].[ext]",
        },
      },
    },
    {
      test: /\.svg/,
      use: "@svgr/webpack",
    },
  ],
};
export const plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new HtmlWebpackPlugin({
    template: join(dirname(fileURLToPath(import.meta.url)), "index.html"),
  }),
  new webpack.ProvidePlugin({
    React: "react",
  }),
  new webpack.NoEmitOnErrorsPlugin(),
];
export const devServer = {
  hot: true,
};

export default {
  mode,
  devtool,
  entry,
  output,
  module,
  plugins,
  devServer,
};

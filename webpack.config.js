const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
    const production = argv.mode === "production";

    const outputDir = production ? "dist" : ".";

    const plugins = [
        new MiniCssExtractPlugin({
            filename: "index.css",
        }),
        new CopyPlugin({
            patterns: [
                { from: "plugin.json", to: "." },
                {
                    from: "src/i18n",
                    to: "i18n/",
                    noErrorOnMissing: true,
                },
                {
                    from: "icon.png",
                    to: ".",
                    noErrorOnMissing: true,
                },
                {
                    from: "preview.png",
                    to: ".",
                    noErrorOnMissing: true,
                },
                {
                    from: "README.md",
                    to: ".",
                    noErrorOnMissing: true,
                },
            ],
        }),
    ];

    return {
        mode: production ? "production" : "development",
        entry: {
            index: "./src/index.ts",
        },
        output: {
            filename: "index.js",
            path: path.resolve(__dirname, outputDir),
            libraryTarget: "commonjs2",
            libraryExport: "default",
        },
        externals: {
            // SiYuan is provided by the host application — do not bundle it
            siyuan: "siyuan",
        },
        resolve: {
            extensions: [".ts", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: "esbuild-loader",
                    options: {
                        target: "es2020",
                    },
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        {
                            loader: "sass-loader",
                            options: {
                                // Use the modern Sass API
                                api: "modern",
                            },
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"],
                },
            ],
        },
        plugins,
        devtool: production ? false : "inline-source-map",
        optimization: {
            minimize: production,
        },
    };
};

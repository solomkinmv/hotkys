import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [...nextCoreWebVitals, { ignores: ["coverage/**"] }];

export default eslintConfig;

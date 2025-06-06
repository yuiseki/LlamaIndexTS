/**
 * Web environment polyfill.
 *
 * @module
 */
import "./global-check.js";

export * from "./als/index.web.js";
export * from "./logger/index.js";
export * from "./utils/base64.js";
export { NotSupportCurrentRuntimeClass } from "./utils/shared.js";
export * from "./web-polyfill.js";
if (typeof window === "undefined") {
  console.warn(
    "You are not in a browser environment. This module is not supposed to be used in a non-browser environment.",
  );
}

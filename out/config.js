"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTHER = void 0;
exports.loadConfig = loadConfig;
const vscode_1 = require("vscode");
;
exports.OTHER = { name: "__OTHER__", filter: "" };
;
/**
 * Loads the user's config settings
 * @returns { Config }
 */
function loadConfig() {
    const config = vscode_1.workspace.getConfiguration("file-organizer");
    return {
        projectNamespacesLast: config.get("projectNamespacesLast", true),
        projectNamespaces: config.get("projectNamespaces", [""]),
        headingTemplate: config.get("headingTemplate", "//\n// { NAME }\n//"),
        order: config.get("order", [
            { name: "STATIC VARIABLES", filter: "static field|property" },
            { name: "EXPORT VARIABLES", filter: "[Export]" },
            { name: "SIGNALS", filter: "[Signal]" },
            { name: "ENUMS", filter: "enum" },
            { name: "PUBLIC VARIABLES", filter: "public field|property" },
            { name: "PROTECTED VARIABLES", filter: "protected field|property" },
            { name: "PRIVATE VARIABLES", filter: "private field|property" },
            { name: "NATIVE FUNCTIONS", filter: "prefix:'_' method" },
            { name: "CUSTOM FUNCTIONS", filter: "method" },
            { name: "STATIC FUNCTIONS", filter: "static method" }
        ]),
        useRegionTags: config.get("useRegionTags", true)
    };
}
//# sourceMappingURL=config.js.map
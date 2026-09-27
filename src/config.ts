import { workspace, WorkspaceConfiguration } from "vscode";


export interface Category {
	
	name   : string;
	filter : string;
	
};

export const OTHER: Category = { name: "__OTHER__", filter: "" };

/**
 * A wrapper for all of the config data
 */
export interface Config {

	/** Whether or not using statements using project namespaces should be last or not*/
	projectNamespacesLast: boolean,

	projectNamespaces: string[];

	/** A generic template the user wants as the headers for each section */
	headingTemplate: string;

	/** A list of where the user wants file contents to show up. */
	order: Category[];

	/** Whether or not the user wants #region / #endregion tags to be used */
	useRegionTags: boolean;
};

/**
 * Loads the user's config settings
 * @returns { Config }
 */
export function loadConfig(): Config {
	const config: WorkspaceConfiguration = workspace.getConfiguration("file-organizer");

	return {
		projectNamespacesLast :      config.get<boolean >("projectNamespacesLast",  true                 ),
		projectNamespaces     :      config.get<string[]>("projectNamespaces",     [""]                  ),
		headingTemplate       :      config.get<string  >("headingTemplate",        "//\n// { NAME }\n//"),
		order                 :      config.get<object[]>("order", [
			{ name: "STATIC VARIABLES",    filter: "static field|property"    },
			{ name: "EXPORT VARIABLES",    filter: "[Export]"                 },
			{ name: "SIGNALS",             filter: "[Signal]"                 },
			{ name: "ENUMS",               filter: "enum"                     },
			{ name: "PUBLIC VARIABLES",    filter: "public field|property"    },
			{ name: "PROTECTED VARIABLES", filter: "protected field|property" },
			{ name: "PRIVATE VARIABLES",   filter: "private field|property"   },
			{ name: "NATIVE FUNCTIONS",    filter: "prefix:'_' method"        },
			{ name: "CUSTOM FUNCTIONS",    filter: "method"                   },
			{ name: "STATIC FUNCTIONS",    filter: "static method"            }
		]) as Category[],
		useRegionTags         :      config.get<boolean >("useRegionTags",          true                 )
	}
}
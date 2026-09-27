# File Organizer
This is a rather rudimentary tool to automate organizing file contents. It currently supports C#.

# Configurations
- `file-organizer.projectNamespacesLast`
	- Whether or not project namespaces (defined by `file-organizer.projectNamespaces`) should be sorted *last* in the using directives list.
	- Default: `true`

-  `file-organizer.projectNamespaces`
	- A list of the names of the project namespaces.
	- Default: workspace directory

- `file-organizer.headingTemplate`
	- A string that represents the format of headers. Will replace `${ NAME }` (spaces optional) with the name of the section as defined in `file-organizer.order`.
	- Default: `//\n// ${ NAME }\n//`; results in the following:
		```C#
		//
		// ${ NAME }
		//
		```
- `file-organizer.order`
	- An array of objects that satisfy two fields:
		- `name` - the name of this category/section
		- `filter` - a set of rules that things must meet in order to be sorted into this category:
			- Attributes, modifiers, and types (property, field, method, &c.) can be selected by name. Use a pipe (`|`) to OR statements together (e.g., `field|property` will filter for both fields and properties)
			- `prefix:''` and `suffix:''` commands define prefixes and suffixes that things must have to be sorted.
	- Default (this is designed with the GODOT game engine in mind):
		| Name                | Filter                       |
		| ------------------- | ---------------------------- |
		| STATIC VARIABLES    | `static field\|property    ` |
		| EXPORT VARIABLES    | `[Export]                  ` |
		| SIGNALS             | `[Signal]                  ` |
		| ENUMS               | `enum                      ` |
		| PUBLIC VARIABLES    | `public field\|property    ` |
		| PROTECTED VARIABLES | `protected field\|property ` |
		| PRIVATE VARIABLES   | `private field\|property   ` |
		| NATIVE FUNCTIONS    | `prefix:'_' method         ` |
		| CUSTOM FUNCTIONS    | `method                    ` |
		| STATIC FUNCTIONS    | `static method             ` |

- `file-organizer.useRegionTags`
	- Whether or not `#region`/`#endregion` tags should be used in tandem with section headers.
	- Default: `true`
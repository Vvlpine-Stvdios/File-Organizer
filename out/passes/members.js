"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizeMembersPass = organizeMembersPass;
exports.organizeMembers = organizeMembers;
const vscode_1 = require("vscode");
const config_1 = require("../config");
let memberCategories = [];
let categoryHeader = "";
/**
 * Reorders the document
 */
function organizeMembersPass(document, tree, config) {
    // Create an array to store the edits, and grab all of the class nodes
    const edits = [];
    const classNodes = getClassDeclarations(tree.rootNode);
    memberCategories = config.order;
    categoryHeader = config.headingTemplate;
    memberCategories.push(config_1.OTHER);
    // Go through each class node and format them
    for (const classNode of classNodes) {
        const edit = organizeMembers(classNode, document, config);
        if (edit !== null) {
            edits.push(edit);
        }
    }
    return edits;
}
/**
 * Recursively searches node tree to find class declaration nodes
 */
function getClassDeclarations(node) {
    // Create an array to store all the class declaration nodes
    const classes = [];
    if (node.type === "class_declaration") {
        classes.push(node);
    }
    for (const child of node.children) {
        classes.push(...getClassDeclarations(child));
    }
    return classes;
}
function organizeMembers(classNode, document, config) {
    // Find all definitions.
    const bodyNode = classNode.children.find((c) => c && c.type === "declaration_list");
    // const comments: Node[] = classNode.children.filter((c: Node): boolean => c.type === "comment");
    // for (let i: number = 1; i < comments.length - 1; i++) {
    // 	if (
    // 		comments[i - 1].text.trim() === "//" &&
    // 		memberCategories.map((c: Category): string => c.name).includes(comments[i].text.replace("//", "").trim()) &&
    // 		comments[i + 1].text.trim() === "//"
    // 	) {
    // 	}
    // }
    // If there are none, return.
    if (!bodyNode) {
        return null;
    }
    // Define and populate a list of all the member declarations.
    const members = getMembers(bodyNode, document, config);
    // If there are no members, return.
    if (members.length === 0) {
        return null;
    }
    // Sort members by type.
    members.sort((a, b) => memberCategories.indexOf(a.category) - memberCategories.indexOf(b.category));
    // Build final text
    let sortedText = "";
    let currentCategory = undefined;
    for (let i = 0; i < members.length; i++) {
        // Get the current member
        const member = members[i];
        // If it's a new category, add padding and header.
        if (member.category !== currentCategory) {
            // Add padding
            if (i > 0) {
                sortedText += "\n\n";
                if (config.useRegionTags) {
                    sortedText += member.indent + "#endregion\n";
                }
            }
            const lowercaseHeader = categoryHeader.toLowerCase();
            const header = (lowercaseHeader.includes("{ name }")
                ? lowercaseHeader.replaceAll("{ name }", member.category.name)
                : lowercaseHeader.includes("{name}")
                    ? lowercaseHeader.replaceAll("{name}", member.category.name)
                    : lowercaseHeader)
                + (config.useRegionTags
                    ? `\n#region ${member.category.name}`
                    : "");
            // Sanity check && indentation
            if (header) {
                sortedText += `${header.split("\n").map((line) => member.indent + line).join("\n")}\n\n`;
            }
            // Set new category
            currentCategory = member.category;
        }
        // If it's the same category, add it to the list
        else {
            // Get the previous member to check if they were originally adjacent
            const previousMember = members[i - 1];
            if (previousMember == null) {
                console.error("Previous member null :(");
                continue;
            }
            if ((member.start === previousMember.end + 1) || // Current member came immediately after the last
                (previousMember.start === member.end + 1) || // Current member came immediately before the last
                (member.start === previousMember.start) // Current member defined on the same line as the last
            ) {
                sortedText += "\n";
            }
            else {
                sortedText += "\n\n";
            }
        }
        // Add member
        sortedText += member.text;
        if (members[members.length - 1] === member && config.useRegionTags) {
            sortedText += `\n\n${member.indent}#endregion`;
        }
    }
    const classIndent = document.lineAt(classNode.startPosition.row).text.substring(0, classNode.startPosition.column);
    const replaceRange = new vscode_1.Range(new vscode_1.Position(bodyNode.startPosition.row, bodyNode.startPosition.column + 1), new vscode_1.Position(bodyNode.endPosition.row, bodyNode.endPosition.column - 1));
    // Ensure we pad the reconstructed text with a leading and trailing newline
    return vscode_1.TextEdit.replace(replaceRange, `\n\n${sortedText}\n\n${classIndent}`);
}
function getMembers(bodyNode, document, config) {
    const members = [];
    let pendingOtherStuff = [];
    for (const child of bodyNode.namedChildren) {
        if (child.type === "comment" || child.type.startsWith("preproc_")) {
            if (child.type === "preproc_if") {
                console.log(child.text, child.childCount);
                const ifChildren = getMembers(child, document, config);
                let name = "";
                let category = config_1.OTHER;
                let text = "";
                const indent = document.lineAt(child.startPosition.row).text.substring(0, child.startPosition.column);
                for (const ifChild of ifChildren) {
                    console.log(`\t${ifChild.text}`);
                    if (ifChild.node.type.endsWith("_declaration")) {
                        name = ifChild.name;
                        category = ifChild.category;
                    }
                    text += `\n${ifChild.text}`;
                }
                text += `\n${indent}#endif`;
                members.push({
                    node: child,
                    name: name,
                    text: text,
                    category: category,
                    start: child.startPosition.row,
                    end: child.endPosition.row,
                    indent: indent
                });
                continue;
            }
            pendingOtherStuff.push(child);
            continue;
        }
        let name = "";
        let category = config_1.OTHER;
        switch (child.type) {
            case "field_declaration":
            case "property_declaration":
            case "method_declaration":
            case "enum_declaration":
                name = getIdentifierName(child);
                category = getCategory(child);
                break;
            default:
                console.log("???: ", child.type);
                break;
        }
        const firstNode = pendingOtherStuff.length > 0 ? pendingOtherStuff[0] : child;
        const indent = document.lineAt(firstNode.startPosition.row).text.substring(0, firstNode.startPosition.column);
        let memberText = "";
        for (const otherStuff of pendingOtherStuff) {
            // Remove old category headers
            if (otherStuff.text.trim() === "//" ||
                config.order.some((c) => c.name === otherStuff.text.trimStart().substring(3)) ||
                otherStuff.type === "preproc_region" ||
                otherStuff.type === "preproc_endregion") {
                continue;
            }
            memberText += indent + otherStuff.text + "\n";
        }
        memberText += indent + child.text;
        members.push({
            node: child,
            name: name,
            text: memberText,
            category: category,
            start: child.startPosition.row,
            end: child.endPosition.row,
            indent: indent,
        });
        pendingOtherStuff = [];
    }
    return members;
}
function getIdentifierName(node) {
    // Methods and Properties usually have the identifier as a direct child
    let idNode = node.children.find(c => c.type === 'identifier');
    if (!idNode && node.type === 'field_declaration') {
        // Fields are nested: field_declaration -> variable_declaration -> variable_declarator -> identifier
        const varDecl = node.children.find(c => c.type === 'variable_declaration');
        if (varDecl) {
            const varDeclarator = varDecl.children.find(c => c.type === 'variable_declarator');
            idNode = varDeclarator?.children.find(c => c.type === 'identifier');
        }
    }
    return idNode ? idNode.text : '';
}
function getCategory(node) {
    for (const category of memberCategories) {
        const filters = category.filter.split(" ");
        function parseFilter(f) {
            // If it's an attribute, return whether or not it has it, negating if there's a `!`
            if (/^(?:|!)\[[A-Za-z0-9_]+\]$/.test(f)) {
                return (f.startsWith("!"))
                    ? !hasAttribute(node, f.split("[")[1].split("]")[0])
                    : hasAttribute(node, f.split("[")[1].split("]")[0]);
            }
            // If it's a prefix command, return whether or not it has it, negating if there's a `!`
            if (/^(?:|!)prefix:\'[A-Za-z0-9_]\'$/.test(f)) {
                return (f.startsWith("!"))
                    ? !node.childForFieldName("name")?.text.startsWith(f.split("'")[1].split("'")[0]) || false
                    : node.childForFieldName("name")?.text.startsWith(f.split("'")[1].split("'")[0]) || false;
            }
            // If it's a suffix command, return whether or not it has it, negating if there's a `!`
            if (/^(?:|!)suffix:\'[A-Za-z0-9_]\'$/.test(f)) {
                return (f.startsWith("!"))
                    ? !node.childForFieldName("name")?.text.endsWith(f.split("'")[1].split("'")[0]) || false
                    : node.childForFieldName("name")?.text.endsWith(f.split("'")[1].split("'")[0]) || false;
            }
            // It's a modifier, return whether or not it has it, negating if there's a `!`
            if (/^(?:|!)(public|protected|private|internal|static|readonly)$/.test(f)) {
                return (f.startsWith("!"))
                    ? !hasModifier(node, f.slice(1))
                    : hasModifier(node, f);
            }
            // If it's a type, return whether or not it has it, negating if there's a `!`
            return (f.startsWith("!"))
                ? !node.type.includes(f)
                : node.type.includes(f);
        }
        if (filters.every((f) => {
            if (f.includes("|")) {
                return f.split("|").some((ff) => parseFilter(ff));
            }
            return parseFilter(f);
        })) {
            return category;
        }
    }
    return config_1.OTHER;
}
function hasModifier(node, modifierName) {
    return node.children.some((c) => c.type === "modifier" && c.text === modifierName);
}
function hasAttribute(node, attributeName) {
    // Attributes are grouped in an attribute_list: [Export], [Signal]
    const attributeLists = node.children.filter((c) => c.type === "attribute_list");
    for (const list of attributeLists) {
        // Checking the raw text of the attribute list is the fastest way to verify
        if (list.text.includes(attributeName)) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=members.js.map
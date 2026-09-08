import { createSchemaValidator } from './catalog-validation';
import * as fs from 'fs';
import { describe, expect, it } from "@jest/globals";

describe("Test schema", () => {
    const shortcutsDir = "shortcuts-data";

    it("All shortcut files match schema", () => {
        const schema = JSON.parse(fs.readFileSync("shortcuts-data/schema/shortcut.schema.json", "utf-8"));
        const validate = createSchemaValidator(schema);

        fs.readdirSync(shortcutsDir).forEach((file) => {
            if (!file.endsWith(".json")) return;
            // Read and parse your JSON data file
            const data: unknown = JSON.parse(fs.readFileSync("shortcuts-data/" + file, "utf-8"));

            // Validate the data against the schema
            const valid = validate(data);

            if (!valid) {
                throw new Error(`Data is not valid according to the schema. File: '${file}'. ` +
                    `Error: ${JSON.stringify(validate.errors)}`);
            }

            expect(data.slug).toStrictEqual(file.replace(".json", ""));
        })
    });

    it.each([
        ["source", "javascript:alert(1)"],
        ["source", "data:text/html,x"],
        ["source", "http://"],
        ["source", "http://javascript:alert(1)"],
        ["source", "https://example.com:99999/path"],
        ["source", "https://[:]/"],
        ["source", "https://%25/path"],
        ["source", "https://[v1.fe]/path"],
        ["source", "\nhttps://example.com"],
        ["source", "https://example.com\n"],
        ["source", "https://example.com/\npath"],
        ["icon", "javascript:alert(1)"],
        ["icon", "https://"],
        ["icon", "http://javascript:alert(1)"],
        ["icon", "icons/\napp.png"],
        ["icon", "icons/app.png\n"],
        ["icon", "//example.com/icon.png"],
    ])("Rejects unsafe %s location", (field, value) => {
        const schema = JSON.parse(fs.readFileSync("shortcuts-data/schema/shortcut.schema.json", "utf-8"));
        const validate = createSchemaValidator(schema);
        const app = {
            $schema: "schema/shortcut.schema.json",
            name: "Test",
            slug: "test",
            [field]: value,
            keymaps: [{
                title: "Default",
                sections: [{
                    title: "General",
                    shortcuts: [{ title: "Test", key: "a" }],
                }],
            }],
        };

        expect(validate(app)).toBe(false);
    });
});

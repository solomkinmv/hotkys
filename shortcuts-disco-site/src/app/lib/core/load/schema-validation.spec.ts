import Ajv from 'ajv';
import * as fs from 'fs';

describe("Test schema", () => {
    const shortcutsDir = "shortcuts-data";

    it("All shortcut files match schema", () => {
        const ajv = new Ajv();
        const schema = JSON.parse(fs.readFileSync("shortcuts-data/schema/shortcut.schema.json", "utf-8"));
        const validate = ajv.compile(schema);

        fs.readdirSync(shortcutsDir).forEach((file) => {
            if (!file.endsWith(".json")) return;
            // Read and parse your JSON data file
            const data = JSON.parse(fs.readFileSync("shortcuts-data/" + file, "utf-8")) as {slug: boolean};

            // Validate the data against the schema
            const valid = validate(data);

            if (!valid) {
                throw new Error(`Data is not valid according to the schema. File: '${file}'. ` +
                    `Error: ${JSON.stringify(validate.errors)}`);
            }

            expect(data.slug).toStrictEqual(file.replace(".json", ""));
        })
    });
});

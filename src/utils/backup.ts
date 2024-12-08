import fs from "fs/promises";

export default async function (original: string, backup: string) {
    try {
        await fs.copyFile(original, backup);
        console.log(`Backup created at ${backup}`);
    } catch (error) {
        console.error(`Error creating backup: ${error}`);
    }
}

import { execSync } from "child_process";
import { format } from "date-fns";

function backup() {
    const mainPath = "C:\\Users\\luhlu\\Documents\\passwords";
    const testPath = `${mainPath}\\tests`;

    const dirName = format(new Date(), "yyyyMMdd-HHmmss");

    if (process.platform === "win32") {
        try {
        execSync(`mkdir "${backupAccountsPath}\\${dirName}"`);
        execSync(`copy "${testPath}\\accounts.json" "${backupAccountsPath}\\${dirName}\\accounts.json"`);
        execSync(`copy "${testPath}\\accounts.txt" "${backupAccountsPath}\\${dirName}\\accounts.txt"`);
        } catch (error) {
        console.error("Failed to create and save the backup:", error.message);
        }
    } else {
        console.log("Cannot create and save the backup. not using Windows.");
    }
}

export default backup;
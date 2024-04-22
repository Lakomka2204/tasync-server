
import { Injectable } from "@nestjs/common";
import { existsSync } from "fs";
import { readFile, unlink, writeFile } from "fs/promises";
import { join } from "path";

@Injectable()
export class FsService {
    constructor(
    ){this.baseFolder = process.env.TMP_FILE_STORAGE}
    baseFolder: string;
    async getFile(filename: string): Promise<Buffer | null> {
        const fullPath = join(this.baseFolder,filename);
        if (!existsSync(fullPath)) return null;
        return await readFile(fullPath);
    }
    async createFile(filename: string, content: Buffer) {
        const fullPath =join(this.baseFolder,filename);
        if (existsSync(fullPath))
            await unlink(fullPath)
        await writeFile(fullPath,content);
    }
    async deleteFile(filename: string) {
        const fullPath = join(this.baseFolder,filename);
        if (existsSync(fullPath))
            await unlink(fullPath)
    }
    exists(filename:string) {
        return existsSync(join(this.baseFolder,filename));
    }
}

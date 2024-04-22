import { Injectable } from "@nestjs/common";
import { existsSync } from "fs";
import { unlink, writeFile } from "fs/promises";
import { join } from "path";

@Injectable()
export class FsService {
    tmpPath: string = process.env.TMP_PATH;
    async writeFile(filename: string,content: Buffer) {
        return await writeFile(join(this.tmpPath,filename),content);
    }
    async deleteFile(filename: string) {
        return await unlink(join(this.tmpPath,filename));
    }
    exists(filename: string) {
        return existsSync(join(this.tmpPath,filename));
    }
}


import { OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ArchiveJob } from './archive.object';
import { Writable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { unlink, writeFile } from 'fs/promises';
import * as AdmZip from 'adm-zip';
import { Constants } from 'adm-zip/util';
import { FsService } from 'src/fs/fs.service';
import { setTimeout } from 'timers/promises';
@Processor('archive')
export class ArchiveProcessor {
    constructor(
        private readonly config: ConfigService,
        private readonly fsService: FsService
    ){}
    @Process('archive')
    async archiveFile(job: Job<ArchiveJob>) {
        if (this.fsService.exists(job.data.location))
            await this.fsService.deleteFile(job.data.location);
        await setTimeout(10000);
        var zip = new AdmZip(undefined,{method:Constants.LZMA});
        for(const file of job.data.items) {
            zip.addLocalFile(file.location,undefined,file.filename);
        }
        const buffer =  await zip.toBufferPromise();
        await this.fsService.createFile(job.data.location,buffer);
        for(const file of job.data.items)
            await this.fsService.deleteFile(file.location);
    }
}

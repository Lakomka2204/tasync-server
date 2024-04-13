
import { OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ArchiveJob } from './archive.object';
import { Writable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { unlink, writeFile } from 'fs/promises';
import * as AdmZip from 'adm-zip';
import { Constants } from 'adm-zip/util';
@Processor('archive')
export class ArchiveProcessor {
    constructor(
        private readonly config: ConfigService
    ){}
    @Process('archive')
    async archiveFile(job: Job<ArchiveJob>) {
        var zip = new AdmZip(undefined,{method:Constants.LZMA});
        for(const file of job.data.items) {
            console.log("Processing file %s %s",file.filename,file.location)
            zip.addLocalFile(file.location,undefined,file.filename);
        }

        return await zip.toBufferPromise();
    }

    @OnQueueCompleted({name:"archive"})
    async uploadArchiveToFileStorage(job:Job<ArchiveJob>) {
        console.log('finished job!!!!');
        const buffer: Buffer = job.returnvalue;
        await writeFile('/tmp/archive.zip',buffer);
        for(const file of job.data.items)
            await unlink(file.location);
    }
}

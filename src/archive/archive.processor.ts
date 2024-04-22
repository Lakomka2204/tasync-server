
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ArchiveJob } from './archive.object';
import * as AdmZip from 'adm-zip';
import { Constants } from 'adm-zip/util';
import { setTimeout } from 'timers/promises';
import { FsService } from 'src/fs/fs.service';
import { AwsService } from 'src/fs/aws.service';
@Processor('archive')
export class ArchiveProcessor {
    constructor(
        private readonly fsService: FsService,
        private readonly awsService: AwsService
    ){}
    @Process('archive')
    async archiveFile(job: Job<ArchiveJob>) {
        if ((await this.awsService.exists(job.data.location)))
            await this.awsService.deleteFile(job.data.location);
        await setTimeout(10000);
        var zip = new AdmZip(undefined,{method:Constants.LZMA});
        for(const file of job.data.items) {
            zip.addLocalFile(file.location,undefined,file.filename);
        }
        const buffer =  await zip.toBufferPromise();
        await this.awsService.createFile(job.data.location,buffer);
        for(const file of job.data.items)
            await this.fsService.deleteFile(file.location);
    }
}

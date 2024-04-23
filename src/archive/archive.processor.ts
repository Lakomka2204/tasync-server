import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ArchiveItem, ArchiveJob } from './archive.object';
import { FsService } from 'src/fs/fs.service';
import { AwsService } from 'src/fs/aws.service';
import * as archiver from 'archiver';

@Processor('archive')
export class ArchiveProcessor {
    constructor(
        private readonly fsService: FsService,
        private readonly awsService: AwsService,
    ) {}
    @Process('archive')
    async createArchive(job: Job<ArchiveJob>) {
        return new Promise<void>((resolve, reject) => {
            const archive = archiver('zip', {
                zlib: { level: 9 },
            });
            const buffers: Buffer[] = [];
            archive.on('data', (chunk) => {
                buffers.push(chunk);
            });
            archive.on('error', reject);
            archive.on('end', async () => {
                const buffer = Buffer.concat(buffers);
                if (await this.awsService.exists(job.data.location))
                    await this.awsService.deleteFile(job.data.location);
                await this.awsService.createFile(job.data.location, buffer);
                for (const { location } of job.data.items)
                    await this.fsService.deleteFile(location);
                resolve();
            });
            job.data.items.forEach((item: ArchiveItem) => {
                if (!item.filename || !item.location) {
                    reject(new Error('Invalid ArchiveItem'));
                }
                archive.file(item.location, { name: item.filename });
            });
            archive.finalize();
        });
    }
}

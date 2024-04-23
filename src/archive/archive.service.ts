import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ArchiveItem, ArchiveJob } from './archive.object';
import { writeFile } from 'fs/promises';

@Injectable()
export class ArchiveService {
    constructor(
        @InjectQueue('archive') private archiveQueue: Queue<ArchiveJob>,
    ) {}
    getRandomFileName() {
        var timestamp = new Date().toISOString().replace(/[-:.]/g, '');
        var random = ('' + Math.random()).substring(2, 8);
        var random_number = timestamp + random;
        return random_number;
    }
    async getQueueJob(id: string) {
        return await this.archiveQueue.getJob(id);
    }
    async addToQueue(id: string, files: Express.Multer.File[]) {
        const locations: ArchiveItem[] = [];
        for (const file of files) {
            const location = this.getRandomFileName();
            locations.push({ filename: file.originalname, location });
            await writeFile(location, file.buffer);
        }
        return await this.archiveQueue.add(
            'archive',
            {
                items: locations,
                location: id,
            },
            {
                jobId: id,
            },
        );
    }
}

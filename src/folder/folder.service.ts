import { Injectable } from '@nestjs/common';
import { Folder } from './folder.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FolderService {
    constructor(
        @InjectRepository(Folder)
        private readonly folderRepo: Repository<Folder>
    ) { }
    async getFolderByName(owner: string, name: string): Promise<Folder | null> {
        return await this.folderRepo.findOne({
            where: {
                name, owner: {
                    username: owner
                }
            },
            relations:['owner'],
            select:{
                owner: {
                    id:true
                }
            }
        });
    }
    async createFolder(ownerId: number, name: string): Promise<Folder | null> {
        const dbFolder = await this.folderRepo.findOne({ where: { name, owner: { id: ownerId } } });
        if (dbFolder)
            return null;
        const folder = this.folderRepo.create({ name, owner: { id: ownerId } });
        return await this.folderRepo.save(folder);
    }
}

import { Injectable } from '@nestjs/common';
import { Folder } from './folder.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFolderDto } from './dto/create-folder.dto';
import { Account } from 'src/account/account.entity';
import { mkdir } from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Injectable()
export class FolderService {
    constructor(
        @InjectRepository(Folder)
        private readonly folderRepo: Repository<Folder>,
        private readonly config: ConfigService
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
    async createFolder(owner: Account, {name,isPublic}:CreateFolderDto): Promise<Folder | null> {
        const dbFolder = await this.folderRepo.findOne({ where: { name, owner: { id: owner.id } } });
        if (dbFolder)
            return null;
        const folder = this.folderRepo.create({ name, owner: { id: owner.id },isPublic });
        const newFolderPath = join(this.config.getOrThrow('TMP_FILE_STORAGE'),owner.username,name);
        await mkdir(newFolderPath)
        return await this.folderRepo.save(folder);
    }
}

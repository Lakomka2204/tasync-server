import { Injectable } from '@nestjs/common';
import { Folder } from './folder.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFolderDto } from './dto/create-folder.dto';
import { Account } from 'src/account/account.entity';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { existsSync } from 'fs';

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
            relations: ['owner'],
            select: {
                owner: {
                    id: true
                }
            }
        });
    }
    async getFolders(owner: Account): Promise<Folder[]> {
        return await this.folderRepo.findBy({ owner: { id: owner.id } });
    }
    async createFolder(owner: Account, { name, isPublic }: CreateFolderDto): Promise<Folder | null> {
        const dbFolder = await this.folderRepo.findOne({ where: { name, owner: { id: owner.id } } });
        if (dbFolder)
            return null;
        const folder = this.folderRepo.create({ name, owner: { id: owner.id }, isPublic });
        const newFolderPath = join(this.config.getOrThrow('TMP_FILE_STORAGE'), owner.username, name);
        await mkdir(newFolderPath)
        return await this.folderRepo.save(folder);
    }
    async deleteFolder(owner: Account, folderName: string): Promise<boolean> {
        const folder = await this.folderRepo.findOne({ where: { name: folderName, owner: { id: owner.id } } });
        if (!folder)
            return false;
        return (await this.folderRepo.softDelete({ id: folder.id })).affected > 0;
    }
    async getFile(requestor: Account, ownerFolderName: string, folderName: string, fileName: string): Promise<Buffer | null> {
        const folder = await this.getFolderByName(ownerFolderName, folderName);
        if (!(folder.isPublic || folder.owner.id === requestor.id))
            return null;
        const filePath = join(this.config.getOrThrow("TMP_FILE_STORAGE"), ownerFolderName, folderName, fileName);
        return await readFile(filePath);
    }
    async createFile(ownerFolderName: string, folderName: string, file: Express.Multer.File): Promise<boolean> {
        const folderPath = join(this.config.getOrThrow("TMP_FILE_STORAGE"), ownerFolderName, folderName);
        const filePath = join(folderPath, file.originalname);
        if (!existsSync(folderPath)) return false;
        await writeFile(filePath, file.buffer);
        return true;
    }
}

import { Injectable } from '@nestjs/common';
import { Folder } from './folder.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFolderDto } from './dto/create-folder.dto';
import { Account } from 'src/account/account.entity';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { SnapshotFolderDto } from './dto/snapshot-folder.dto';
import { BaseFolderDto } from './dto/base-folder.dto';

@Injectable()
export class FolderService {
    constructor(
        @InjectRepository(Folder)
        private readonly folderRepo: Repository<Folder>,
        private readonly config: ConfigService
    ) { }
    async canAccessFolder(ownerId: number, { ownerFolderName, folderName }: BaseFolderDto): Promise<boolean> {
        const folder = await this.getFolderByName({ ownerFolderName, folderName });
        return folder.isPublic || ownerId == folder.owner.id;
    }
    async getFolderByName({ folderName, ownerFolderName }: BaseFolderDto): Promise<Folder | null> {
        return await this.folderRepo.findOne({
            where: {
                name: folderName,
                owner: {
                    username: ownerFolderName
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
        return await this.folderRepo.find({
            where:
                { owner: { id: owner.id } },
            relations: ['owner'],
            select: {
                owner: {
                    id: true
                }
            }
        });
    }
    async createFolder(owner: Account, { name, isPublic }: CreateFolderDto): Promise<boolean> {
        const dbFolder = await this.folderRepo.findOne({ where: { name, owner: { id: owner.id } } });
        if (dbFolder)
            return false;
        const folder = this.folderRepo.create({ name, owner: { id: owner.id }, isPublic });
        const newFolderPath = join(this.config.getOrThrow('TMP_FILE_STORAGE'), owner.username, name);
        await mkdir(newFolderPath)
        return !!(await this.folderRepo.save(folder));
    }
    async deleteFolder(owner: Account, folderName: string): Promise<boolean> {
        const folder = await this.folderRepo.findOne({ where: { name: folderName, owner: { id: owner.id } } });
        if (!folder)
            return false;
        return (await this.folderRepo.softDelete({ id: folder.id })).affected > 0;
    }
    async createSnapshot(snapshot: SnapshotFolderDto, archive: Buffer, info: Buffer) {
        const folder = await this.getFolderByName(snapshot);
        folder.snapshots.push(snapshot.snapshot);
        const folderName = join(this.config.getOrThrow("TMP_FILE_STORAGE"), snapshot.ownerFolderName, snapshot.folderName);
        //! i forgot that i will be creating archives on server side...
        const archiveName = join(folderName, `${snapshot.snapshot}.zip`);
        const infoName = join(folderName, `${snapshot.snapshot}.tasync`);
        await writeFile(archiveName, archive);
        await writeFile(infoName, info);
        await this.folderRepo.save(folder);
    }
    async getSnapshotArchive(snapshot: SnapshotFolderDto) {

    }
}

import { Injectable } from '@nestjs/common';
import { Folder } from './folder.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/account/account.entity';
import { BaseFolderDto } from './dto/base-folder.dto';
import { CommitFolderDto } from './dto/commit-folder.dto';

@Injectable()
export class FolderService {
    constructor(
        @InjectRepository(Folder)
        private readonly folderRepo: Repository<Folder>
    ) { }
    async getFolderByName({ folderName, ownerId }: BaseFolderDto): Promise<Folder | null> {
        return await this.folderRepo.findOne({
            where: {
                name: folderName,
                owner: {
                    id: ownerId
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
    async createFolder(folder: BaseFolderDto): Promise<boolean> {
        const dbFolder = await this.getFolderByName(folder);
        if (dbFolder)
            return false;
        const createdFolder = this.folderRepo.create({ name: folder.folderName, owner: { id: folder.ownerId }});
        return !!(await this.folderRepo.save(createdFolder));
    }
    async deleteFolder(folder: BaseFolderDto): Promise<boolean> {
        const dbFolder = await this.getFolderByName(folder);
        if (!dbFolder)
            return false;
        return (await this.folderRepo.softDelete({ id: dbFolder.id })).affected > 0;
    }
    async createCommit(folder: CommitFolderDto): Promise<Folder> {
        const dbFolder = await this.getFolderByName(folder);
        dbFolder.commits.push(folder.commit);
        return await this.folderRepo.save(dbFolder);
    }
    async deleteCommit(folder: CommitFolderDto): Promise<boolean> {
        const dbFolder = await this.getFolderByName(folder);
        if (!dbFolder)
            return false;
        return (await this.folderRepo.softDelete({id:dbFolder.id})).affected > 0;
    }
    composeUniqueId(folder: CommitFolderDto): string {
        return `${folder.ownerId}-${folder.folderName}-${folder.commit}`;
    }
}

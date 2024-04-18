import { BadRequestException, Controller, Delete, Get, Headers, HttpCode, MaxFileSizeValidator, NotFoundException, Param, ParseFilePipe, Put, Query, Req, Res, ServiceUnavailableException, StreamableFile, UnprocessableEntityException, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Account } from 'src/account/account.entity';
import { AccountGuard } from 'src/account/account.guard';
import { FolderService } from './folder.service';
import { FolderInfoDto } from './dto/folder-info.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { Throttle, minutes } from '@nestjs/throttler';
import { ArchiveService } from 'src/archive/archive.service';
import { isAlphanumeric, isString } from 'class-validator';
import { FsService } from 'src/fs/fs.service';

@Controller('folder')
@UseGuards(AccountGuard)
export class FolderController {
    constructor(
        private readonly folderService: FolderService,
        private readonly archiveService: ArchiveService,
        private readonly fsService: FsService
    ) { }
    @Get()
    @HttpCode(200)
    async getAccountFolders(
        @Req() req: Request
    ): Promise<FolderInfoDto[]> {
        const account: Account = JSON.parse(req.headers.authorization);
        return plainToInstance(FolderInfoDto, await this.folderService.getFolders(account));
    }
    @Get(":name")
    @HttpCode(200)
    async getFolderInfo(
        @Req() req: Request,
        @Param('name') folderName: string,
    ): Promise<FolderInfoDto> {
        const account: Account = JSON.parse(req.headers.authorization);
        const folder = await this.folderService.getFolderByName({ ownerId: account.id, folderName });
        if (!folder)
            throw new NotFoundException("Folder is not found");
        return plainToClass(FolderInfoDto, folder);
    }

    @Put(':name')
    @HttpCode(201)
    @Throttle({ default: { ttl: minutes(2), limit: 2 } })
    async createFolder(
        @Req() req: Request,
        @Param("name") folderName: string
    ): Promise<void> {
        const account: Account = JSON.parse(req.headers.authorization);
        if (!(isString(folderName) && isAlphanumeric(folderName)))
            throw new BadRequestException("Name should be alphanumerical");
        const folder = await this.folderService.createFolder({ ownerId: account.id, folderName });
        if (!folder) throw new BadRequestException(`Folder with specified name already exists`);
    }

    @Delete(':name')
    @HttpCode(204)
    async deleteFolder(
        @Req() req: Request,
        @Param('name') folderName: string
    ): Promise<void> {
        const account: Account = JSON.parse(req.headers.authorization);
        const isDeleted = await this.folderService.deleteFolder({ ownerId: account.id, folderName });
        if (!isDeleted)
            throw new NotFoundException("Folder is not found");
    }

    @Put(":name/:commit")
    @HttpCode(201)
    @Throttle({ default: { ttl: minutes(1), limit: 5 } })
    @UseInterceptors(FilesInterceptor('file'))
    async createSnapshot(
        @Req() req: Request,
        @Headers("Ignore") ignoreFiles: string[],
        @Param("name") folderName: string,
        @Param("commit") commit: string,
        @Query("force") forceRewrite: string,
        @UploadedFiles(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 104_858_624, message: "Too large file" })
                ]
            })
        ) files: Express.Multer.File[],
    ): Promise<string> {
        console.log('ignore files', ignoreFiles);
        // check commit number
        if (isNaN(parseInt(commit?.toString())))
            throw new BadRequestException("Commit should be number");
        // check files
        if (!files || files.length == 0)
            throw new BadRequestException("Files are required");
        // get account
        const account: Account = JSON.parse(req.headers.authorization);
        // get or create folder
        let folder = await this.folderService.getFolderByName({ folderName, ownerId: account.id })
        if (!folder)
            folder = await this.folderService.createFolder({ ownerId: account.id, folderName });
        // check commit
        const lastCommit = folder.commits[folder.commits.length - 1];
        if (folder.commits.length > 0 && lastCommit != commit && forceRewrite !== "true")
            throw new BadRequestException(`This commit is behind the latest`);
        // generate new commit
        const newCommit = Math.floor(Date.now() / 1000).toString();
        // generate name for archive
        const uniqueName = this.folderService.composeUniqueId({ ownerId: account.id, folderName: folder.id.toString(), commit: newCommit });
        // create commit in db
        await this.folderService.createCommit({ ownerId: account.id, folderName, commit: newCommit });
        // add archiving into queue
        await this.archiveService.addToQueue(uniqueName, files.filter(x => x.size > 0));
        // update ignored files if they different
        if (!folder.commits.every(x => ignoreFiles.includes(x)))
            await this.folderService.updateIgnoredFiles(folder.id, ignoreFiles);
        // return time of new commit
        return newCommit;
    }

    @Get(":name/:commit")
    @HttpCode(200)
    @Throttle({ default: { ttl: minutes(3), limit: 20 } })
    async getSnapshot(
        @Req() req: Request,
        @Param("name") folderName: string,
        @Param("commit") commit: string,
        @Res({ passthrough: true }) res: Response
    ): Promise<StreamableFile> {
        const account: Account = JSON.parse(req.headers.authorization);
        const folder = await this.folderService.getFolderByName({ folderName, ownerId: account.id });
        if (commit == "last" && folder.commits.length > 0)
            commit = folder.commits[folder.commits.length - 1];
        if (!folder.commits.includes(commit))
            throw new NotFoundException("Commit is not found");
        const uniqueFileName = this.folderService.composeUniqueId({
            ownerId: account.id,
            folderName: folder.id.toString(),
            commit
        });
        const buffer = await this.fsService.getFile(uniqueFileName);
        if (!buffer) {
            const job = await this.archiveService.getQueueJob(uniqueFileName);
            const state = await job.getState();
            switch (state) {
                case "active":
                    throw new ServiceUnavailableException("Your files are being processed right now");
                case 'waiting':
                    throw new ServiceUnavailableException("Your files are in queue right now");
                default:
                    throw new UnprocessableEntityException("Your files are unaccessible right now",);
            }
        }
        res.header("Commit", commit)
        res.header("Ignore", folder.ignoreFiles);
        return new StreamableFile(buffer, { disposition: 'attachment', length: buffer.length, type: 'application/zip' });
    }
    @Delete(":name/:commit")
    @HttpCode(200)
    @Throttle({ default: { ttl: minutes(1), limit: 20 } })
    async deleteSnapshot(
        @Req() req: Request,
        @Param("name") folderName: string,
        @Param("commit") commit: string
    ): Promise<void> {
        const account: Account = JSON.parse(req.headers.authorization);
        const isDeleted = await this.folderService.deleteCommit({
            ownerId: account.id,
            folderName,
            commit
        });
        if (!isDeleted)
            throw new NotFoundException("Folder is not found")
    }

}

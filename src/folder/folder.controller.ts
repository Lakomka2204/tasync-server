import { BadRequestException, Body, Controller, Delete, FileTypeValidator, Get, Head, HttpCode, MaxFileSizeValidator, NotFoundException, Param, ParseFilePipe, Post, Put, Req, StreamableFile, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { join } from 'path';
import { Account } from 'src/account/account.entity';
import { AccountGuard } from 'src/account/account.guard';
import { FolderService } from './folder.service';
import { FolderInfoDto } from './dto/folder-info.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { CreateFolderDto } from './dto/create-folder.dto';
import { Throttle, minutes } from '@nestjs/throttler';
import { ArchiveService } from 'src/archive/archive.service';

@Controller('folder')
@UseGuards(AccountGuard)
export class FolderController {
    constructor(
        private readonly folderService: FolderService,
        private readonly archiveService: ArchiveService
    ) { }
    @Get()
    @HttpCode(200)
    async getAccountFolders(
        @Req() req: Request
    ): Promise<FolderInfoDto[]> {
        const account: Account = JSON.parse(req.headers.authorization);
        return plainToInstance(FolderInfoDto, await this.folderService.getFolders(account));
    }
    @Get(":owner/:name")
    @HttpCode(200)
    async getFolderInfo(
        @Req() req: Request,
        @Param('owner') ownerFolderName: string,
        @Param('name') folderName: string,
    ): Promise<FolderInfoDto> {
        const folder = await this.folderService.getFolderByName({ownerFolderName, folderName});
        if (!folder)
            throw new NotFoundException("Folder is not found");
        const account: Account = JSON.parse(req.headers.authorization);
        if (!(await this.folderService.canAccessFolder(account.id, {ownerFolderName, folderName})))
            throw new NotFoundException("Folder is not found");
        return plainToClass(FolderInfoDto, folder);
    }

    @Put()
    @HttpCode(201)
    @Throttle({ default: { ttl: minutes(2), limit: 2 } })
    async createFolder(
        @Req() req: Request,
        @Body() createFolderBody: CreateFolderDto
    ) {
        const account: Account = JSON.parse(req.headers.authorization);
        const folder = await this.folderService.createFolder(account, createFolderBody);
        if (!folder) throw new BadRequestException(`Folder with specified name already exists`);
    }

    @Delete(':name')
    @HttpCode(204)
    async deleteFolder(
        @Req() req: Request,
        @Param('name') folderName: string
    ) {
        const account: Account = JSON.parse(req.headers.authorization);
        const isDeleted = await this.folderService.deleteFolder(account, folderName);
        if (!isDeleted)
            throw new NotFoundException("Folder is not found");
    }

    @Put(":name")
    @HttpCode(201)
    @Throttle({ default: { ttl: minutes(1), limit: 5 } })
    @UseInterceptors(FilesInterceptor('file'))
    async uploadArchive(
        @Req() req: Request,
        @Param("name") folderName: string,
        @UploadedFiles(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 104_858_624, message: "Too large file" })
                ]
            })
        ) files: Express.Multer.File[],
    ) {
        if (!files || files.length == 0)
            throw new BadRequestException("Files is required");
        await this.archiveService.addToQueue(files.filter(x => x.size > 0));
        return `Files received ${files.length}`;
    }
    @Head(":owner/:name")
    @HttpCode(200)
    async getInfoFile(
        @Req() req: Request,
        @Param('owner') ownerFolderName: string,
        @Param("name") folderName: string
    ) {
        const account: Account = JSON.parse(req.headers.authorization);
        if (!(await this.folderService.canAccessFolder(account.id,{ownerFolderName,folderName})))
            throw new NotFoundException("Folder is not found");

    }
}

import {  BadRequestException, Body, Controller, Delete, Get, HttpCode, MaxFileSizeValidator, NotFoundException, Param, ParseFilePipe, Post, Put, Req, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor} from '@nestjs/platform-express';
import { Request } from 'express';
import { join } from 'path';
import { Account } from 'src/account/account.entity';
import { AccountGuard } from 'src/account/account.guard';
import { FolderService } from './folder.service';
import { FolderInfoDto } from './dto/folder-info.dto';
import { plainToClass } from 'class-transformer';
import { CreateFolderDto } from './dto/create-folder.dto';
import { Throttle, minutes } from '@nestjs/throttler';

@Controller('folder')
@UseGuards(AccountGuard)
export class FolderController {
    constructor(
        private readonly folderService: FolderService
    ){}
    @Get(":owner/:name")
    @HttpCode(200)
    async getFolderInfo(
        @Req() req: Request,
        @Param('owner') ownerName: string,
        @Param('name') folderName: string,
    ): Promise<FolderInfoDto> {
        const folder = await this.folderService.getFolderByName(ownerName,folderName);
        if (!folder)
            throw new NotFoundException("Folder is not found");
        if (folder?.isPublic)
            return plainToClass(FolderInfoDto,folder);
        const account: Account = JSON.parse(req.headers.authorization);
        if (folder.owner.id === account.id)
            return plainToClass(FolderInfoDto,folder);
        throw new NotFoundException("Folder is not found");
    }

    @Put()
    @HttpCode(201)
    @Throttle({ default: { ttl: minutes(2), limit: 2 } })
    async createFolder(
        @Req() req: Request,
        @Body() createFolderBody: CreateFolderDto
    ) {
        const account: Account = JSON.parse(req.headers.authorization);
        const folder = await this.folderService.createFolder(account,createFolderBody);
        if (!folder) throw new BadRequestException(`Folder with specified name already exists`);
        return folder.id;

    }

    @Delete(':name')
    @HttpCode(204)
    async deleteFolder(
        @Req() req: Request,
        @Param('name') folderName: string
    ) {
        const account: Account = JSON.parse(req.headers.authorization);
        const isDeleted = await this.folderService.deleteFolder(account,folderName);
        if (!isDeleted)
            throw new NotFoundException("Folder is not found");
    }

    @Put(":name")
    @HttpCode(201)
    @Throttle({default: {ttl:minutes(1), limit:5}})
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @Req() req: Request,
        @Param("name") folderName: string,
        @UploadedFile(new ParseFilePipe({
            validators:[
                new MaxFileSizeValidator({maxSize: 104_857_600,message:"Too large file"})
            ]
        }))
        file: Express.Multer.File
    ) {
        const account: Account = JSON.parse(req.headers.authorization);
        if (!file)
            throw new BadRequestException("File is required");
        const isCreated = await this.folderService.createFile(account.username,folderName,file);
        if (!isCreated)
            throw new NotFoundException("Folder is not found");

    }
    @Get(":owner/:name/:file")
    @HttpCode(200)
    @Throttle({default: {ttl:minutes(5), limit:50}})
    async getFile(
        @Req() req: Request,
        @Param('owner') ownerFolderName: string,
        @Param('name') folderName: string,
        @Param('file') fileName: string,
    ): Promise<StreamableFile> {
        const account: Account = JSON.parse(req.headers.authorization);
        const file = await this.folderService.getFile(account,ownerFolderName,folderName,fileName);
        if (!file)
            throw new NotFoundException("File not found")

        return new StreamableFile(file,{length:file.length});
    }
}

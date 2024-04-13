import {  BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor} from '@nestjs/platform-express';
import { Request } from 'express';
import { join } from 'path';
import { Account } from 'src/account/account.entity';
import { AccountGuard } from 'src/account/account.guard';
import { FolderService } from './folder.service';
import { FolderInfoDto } from './dto/folder-info.dto';
import { plainToClass } from 'class-transformer';
import { CreateFolderDto } from './dto/create-folder.dto';

@Controller('folder')
@UseGuards(AccountGuard)
export class FolderController {
    constructor(
        private readonly fileService: FolderService
    ){}
    @Get(":owner/:name")
    async getFolderInfo(
        @Req() req: Request,
        @Param('owner') ownerName: string,
        @Param('name') folderName: string,
    ): Promise<FolderInfoDto> {
        const folder = await this.fileService.getFolderByName(ownerName,folderName);
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
    async createFolder(
        @Req() req: Request,
        @Body() createFolderBody: CreateFolderDto
    ) {
        const account: Account = JSON.parse(req.headers.authorization);
        const folder = await this.fileService.createFolder(account.id,createFolderBody);
        if (!folder) throw new BadRequestException(`Folder with specified name already exists`);
        return folder.id;

    }
    @Post('info')
    @UseInterceptors(FileInterceptor('file'))
    async uploadArchive(
        @Param('name') folderName: string,
        @Param('owner') ownerName: string,
        @UploadedFile()
        file: Express.Multer.File
    ) {
        if (file.originalname !== ".tasync") throw new BadRequestException("Invalid file type");
        return join(ownerName,folderName);
    }
}

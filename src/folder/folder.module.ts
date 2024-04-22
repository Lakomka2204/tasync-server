import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './folder.entity';
import { FolderService } from './folder.service';
import { FolderController } from './folder.controller';
import { AccountModule } from 'src/account/account.module';
import { ArchiveModule } from 'src/archive/archive.module';
import { FileModule } from 'src/fs/file.module';

@Module({
    imports:[TypeOrmModule.forFeature([Folder]),AccountModule,ArchiveModule,FileModule],
    providers:[FolderService],
    controllers:[FolderController],
    exports:[TypeOrmModule]
})
export class FolderModule {}

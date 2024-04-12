import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './folder.entity';
import { FolderService } from './folder.service';
import { FolderController } from './folder.controller';
import { AccountModule } from 'src/account/account.module';

@Module({
    imports:[TypeOrmModule.forFeature([Folder]),AccountModule],
    providers:[FolderService],
    controllers:[FolderController],
    exports:[TypeOrmModule]
})
export class FolderModule {}

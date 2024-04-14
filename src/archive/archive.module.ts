import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ArchiveService } from "./archive.service";
import { ArchiveProcessor } from "./archive.processor";
import { FsModule } from "src/fs/fs.module";

@Module({
    imports: [BullModule.registerQueue({name:"archive"}),FsModule],
    exports: [ArchiveService,ArchiveProcessor],
    providers: [ArchiveService,ArchiveProcessor]
})
export class ArchiveModule {}

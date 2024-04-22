import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ArchiveService } from "./archive.service";
import { ArchiveProcessor } from "./archive.processor";
import { FileModule } from "src/fs/file.module";

@Module({
    imports: [BullModule.registerQueue({name:"archive"}),FileModule],
    exports: [ArchiveService,ArchiveProcessor],
    providers: [ArchiveService,ArchiveProcessor]
})
export class ArchiveModule {}

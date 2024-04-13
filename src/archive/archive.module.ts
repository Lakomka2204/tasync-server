import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ArchiveService } from "./archive.service";
import { ArchiveProcessor } from "./archive.processor";

@Module({
    imports: [BullModule.registerQueue({name:"archive"})],
    exports: [ArchiveService,ArchiveProcessor],
    providers: [ArchiveService,ArchiveProcessor]
})
export class ArchiveModule {}

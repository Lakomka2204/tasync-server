import { Module } from "@nestjs/common";
import { AwsService } from "./aws.service";
import { FsService } from "./fs.service";

@Module({
    providers: [AwsService,FsService],
    exports:[AwsService,FsService]
})
export class FileModule {}

import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AwsService {
    private readonly s3Client = new S3Client({
        region: process.env.AWS_S3_REGION,
    });
    bucket: string = process.env.AWS_S3_BUCKET;
    async getFile(filename: string) {
        return await this.s3Client.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: filename,
            }),
        );
    }
    async createFile(filename: string, content: Buffer) {
        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: filename,
                Body: content,
            }),
        );
        return true;
    }
    async deleteFile(filename: string) {
        return await this.s3Client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: filename,
            }),
        );
    }
    async exists(filename: string) {
        try {
            await this.s3Client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: filename,
                }),
            );
            return true;
        } catch {
            return false;
        }
    }
}

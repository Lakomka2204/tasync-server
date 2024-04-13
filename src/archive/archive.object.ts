export type ArchiveItem = {
    filename: string;
    location: string;
}
export class ArchiveJob {
    items: ArchiveItem[];
    folderId: number;
}

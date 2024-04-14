export type ArchiveItem = {
    filename: string;
    location: string;
}
export class ArchiveJob {
    items: ArchiveItem[];
    location: string;
}

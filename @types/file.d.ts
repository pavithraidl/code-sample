/**
 * Type definition for file and file type related stuff
 */

export interface FileItem {
  caption: string;
  url: string,
  type?: 'image' | 'video' | '360view';
}

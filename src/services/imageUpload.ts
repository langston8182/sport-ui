import { api } from './api';

interface UploadInitResponse {
    uploadUrl: string;
    object: {
        key: string;
    };
}

export async function uploadImage(file: File): Promise<string> {
    const initResponse = await api.post<UploadInitResponse>('/exercises/upload-init', {
        fileName: file.name,
        contentType: file.type,
    });

    await fetch(initResponse.uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
        },
        body: file,
    });

    return initResponse.object.key;
}

export type ImageSize = 'sm' | 'md' | 'lg';

export function getImageUrl(imageKeyOriginal: string, size: ImageSize = 'sm'): string {
    const cdnUrl = import.meta.env.VITE_CDN_URL;
    const basename = imageKeyOriginal.split('/').pop()?.replace(/\.[^.]+$/, '');
    return `${cdnUrl}/processed/${size}/${basename}.jpg`;
}

export function getResponsiveImageUrl(imageKeyOriginal: string): string {
    const cdnUrl = import.meta.env.VITE_CDN_URL;
    const basename = imageKeyOriginal.split('/').pop()?.replace(/\.[^.]+$/, '');
    return `${cdnUrl}/processed/sm/${basename}.jpg`;
}

export function getResponsiveImageSrcSet(imageKeyOriginal: string): string {
    const cdnUrl = import.meta.env.VITE_CDN_URL;
    const basename = imageKeyOriginal.split('/').pop()?.replace(/\.[^.]+$/, '');
    return `
    ${cdnUrl}/processed/sm/${basename}.jpg 640w,
    ${cdnUrl}/processed/md/${basename}.jpg 768w,
    ${cdnUrl}/processed/lg/${basename}.jpg 1024w
  `.trim();
}
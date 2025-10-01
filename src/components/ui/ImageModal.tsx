import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    imageSrcSet?: string;
    alt: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, imageSrcSet, alt }: ImageModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
            >
                <X className="w-6 h-6" />
            </button>

            <div
                className="max-w-7xl max-h-[90vh] p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    srcSet={imageSrcSet}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1280px"
                    alt={alt}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
            </div>
        </div>
    );
}
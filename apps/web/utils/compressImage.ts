export const compressImage = async (file: File): Promise<File> => {
    // If not an image, return original
    if (!file.type.startsWith('image/')) return file;
    // If small enough, return original (e.g. < 1MB)
    if (file.size < 1024 * 1024) return file;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 1280;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file); // Fallback
                    }
                }, 'image/jpeg', 0.7); // 70% Quality
            } else {
                resolve(file);
            }
        };
        img.onerror = (error) => reject(error);
    });
};

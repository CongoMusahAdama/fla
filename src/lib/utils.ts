export const getImageUrl = (url: string | undefined | null) => {
    if (!url || url === '/product-1.jpg') return '/product-1.jpg';
    
    const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    // If it's already a full URL
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
        // If it's already a Cloudinary URL, apply optimization
        if (url.includes('res.cloudinary.com')) {
            if (!url.includes('/image/upload/f_auto,q_auto')) {
                return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
            }
            return url;
        }

        // If it's an external URL and we have a Cloudinary cloud name, use Fetch API for optimization
        if (cloudinaryCloudName && url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
            return `https://res.cloudinary.com/${cloudinaryCloudName}/image/fetch/f_auto,q_auto/${url}`;
        }
        
        return url;
    }

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
    const baseUrl = apiBase.replace(/\/api\/?$/, '');

    // Handle legacy local uploads
    if (url.startsWith('/uploads/')) return `${baseUrl}${url}`;
    if (url.startsWith('uploads/')) return `${baseUrl}/${url}`;
    if (url.startsWith('/')) return url;

    return `${baseUrl}/uploads/${url}`;
};

/**
 * Generates a Cloudinary transformation URL for specific dimensions
 */
export const getOptimizedImage = (url: string, width: number = 800, height?: number) => {
    const baseUrl = getImageUrl(url);
    if (baseUrl.includes('res.cloudinary.com')) {
        let transformations = `f_auto,q_auto,w_${width}`;
        if (height) transformations += `,h_${height},c_fill`;
        
        // Remove existing f_auto,q_auto if present to avoid duplication
        const cleanUrl = baseUrl.replace(/\/image\/upload\/[^\/]+\//, '/image/upload/');
        return cleanUrl.replace('/image/upload/', `/image/upload/${transformations}/`);
    }
    return baseUrl;
};

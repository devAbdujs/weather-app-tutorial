export const getOptimizedImageUrl = (publicId: string, width?: number) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.warn('Cloudinary cloud name is missing in environment variables.');
    return '';
  }

  // f_auto = automatic format (WebP/AVIF depending on browser)
  // q_auto = automatic quality compression (saves huge bandwidth)
  // c_limit,w_{width} = resize only if the image is larger than the container
  
  const transforms = ['f_auto', 'q_auto'];
  if (width) transforms.push(`c_limit,w_${width}`);
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(',')}/${publicId}`;
};

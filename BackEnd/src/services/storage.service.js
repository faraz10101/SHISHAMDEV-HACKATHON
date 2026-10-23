    const cloudinary = require('cloudinary').v2;

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    async function uploadFile(file) {

        return new Promise((resolve, reject) => {

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'musics',  // Folder inside cloudinary 
                    public_id: 'music' + Date.now(),
                    quality: 'auto',
                    timeout: 60000, // 60 seconds timeout
                },
                (error, result) => {
                    if (error) {
                        console.error('Upload Error:', error);
                        reject(error);
                    } else {
                        resolve(result)
                    }
                }
            )

            // Buffer ko upload stream mein daalo
            uploadStream.end(file.buffer);

        })
    }

    module.exports = { uploadFile };
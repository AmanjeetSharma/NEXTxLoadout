import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary and handle cleanup
const uploadOnCloudinary = async (localFilePath, folder = "") => {
    try {
        if (!localFilePath) {
            return "Local file path is missing.";
        }

        const options = {
            resource_type: "auto",
        };

        if (folder) {
            options.folder = folder;
        }

        const result = await cloudinary.uploader.upload(localFilePath, options);

        console.log("✅ File uploaded to Cloudinary:", result.url);
        
        // Clean up local file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("🧹  Local file deleted after successful upload.");
        }

        return result.secure_url;

    } catch (error) {
        console.error("❌ Cloudinary upload failed:", error.message);

        // Cleanup only if file exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("🗑️ Local file deleted due to failure.");
        }

        return null;
    }
};

export { uploadOnCloudinary };

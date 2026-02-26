import multer from "multer";
import ApiError from "../utils/apiError.js"; // Use our error when a non-image file is uploaded

// 1. Storage settings (where to save and how to name the file)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Folder where files are stored
    },
    filename: function (req, file, cb) {
        // Avoid collisions if multiple users upload the same filename at the same time
        // Name format: user-randomNumber-timestamp.extension
        const ext = file.mimetype.split("/")[1];
        const uniqueName = `user-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        cb(null, uniqueName);
    },
});

// 2. Security filter (only accept images)
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(new ApiError("Only Images allowed!", 400), false);
    }
};

// 3. Assemble configuration
const upload = multer({ storage: storage, fileFilter: multerFilter });

// Route middleware (accepts a single image from the profileImage field)
export const uploadUserImage = upload.single("profileImage");

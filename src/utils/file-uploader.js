const multer = require("multer");
const path = require("path");
const directoryPath = path.join(__root, "/public/files");

var storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, directoryPath);
    },
    filename: (req, file, cb) => {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)

        );
    },
});

const upload = multer({ storage: storage });
exports.upload = upload;
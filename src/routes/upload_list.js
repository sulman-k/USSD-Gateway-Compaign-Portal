const { upload } = require(`${__utils}/file-uploader`);
module.exports = (router, controller) => {

    router.get("/getUploadedList", controller.getUploadedList);
    router.delete("/deleteUploadedList/:id", controller.deleteUploadedList);

    router.post(
        "/upload_list",
        upload.single("upload_list"),
        controller.uploadList
    );



    // router.delete("/deleteCampaign/:id", controller.deleteCampaign);
    // router.put("/updateStatus/:id", controller.updateStatus);

    //campaign type
    // router.post("/addCampaignType", controller.addCampaignType);
    // router.get("/getCampaignTypes", controller.getCampaignTypes);
    // router.delete("/deleteCampaignType/:id", controller.deleteCampaignType);
};
const { upload } = require(`${__utils}/file-uploader`);
module.exports = (router, controller) => {
  router.get("/getCampaigns/:id", controller.getCampaigns);
  router.get(
    "/getMsisdnCampaignHistory/:id",
    controller.getMsisdnCampaignHistory
  );
  router.get("/getCampaignUsers", controller.getCampaignUsers);
  router.get("/downloadCampaignData", controller.downloadCampaignData);

  router.post(
    "/addCampaign",
    upload.single("users_list"),
    controller.addCampaign
  );
  router.put(
    "/updateCampaign/:id",
    upload.single("users_list"),
    controller.updateCampaign
  );
  router.get("/getCampMenu/:id", controller.getCampMenu);
  router.get("/getCampEsmeNames", controller.getCampEsmeNames);
  router.get("/getAllCampTree", controller.getAllCampTree);
  router.get("/getWhiteListGroups", controller.getWhiteListGroups);

  router.get(
    "/updateCampaignStatus/:id/:status",
    controller.updateCampaignStatus
  );

  router.get("/getCampaignUnits", controller.getCampaignUnits);
  router.get("/getAllUser", controller.getAllUser);

  router.get("/findByMsisdn", controller.findByMsisdn);

  router.post("/campaignResponse", controller.campaignResponse);

  // router.get("/getServiceCodes", controller.getServiceCodes);

  // router.delete("/deleteCampaign/:id", controller.deleteCampaign);
  // router.put("/updateStatus/:id", controller.updateStatus);

  //campaign type
  // router.post("/addCampaignType", controller.addCampaignType);
  // router.get("/getCampaignTypes", controller.getCampaignTypes);
  // router.delete("/deleteCampaignType/:id", controller.deleteCampaignType);
};

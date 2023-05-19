module.exports = (router, controller) => {
  router.get("/totalCampaigns", controller.totalCampaigns);
  router.get("/dateWiseCampaigns", controller.dateWiseCampaign);
  router.get("/unitDetails", controller.unitDetails);
  router.get("/campaignUserStats/:id", controller.campaignUserStats);
  router.get("/campaignProgressStats", controller.campaignProgressStats);
  router.get("/getCampaignSuccessHistory/:id", controller.getCampaignSuccessHistory);
};

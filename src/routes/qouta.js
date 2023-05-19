module.exports = (router, controller) => {
  router.get("/getQuotas", controller.getQuota);
  router.post("/addQuota", controller.addQuota);
  router.put("/updateQuota/:id", controller.updateQuota);
  router.get("/getPackages", controller.getPackages);
  router.get("/getCustomPackage", controller.getCustomPackage);
  router.post("/quotaCharging", controller.quotaCharging);
};

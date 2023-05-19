module.exports = (router, controller) => {
  router.post("/updateCredential", controller.updateCredential);
  router.get("/getProfile", controller.getProfile);
};

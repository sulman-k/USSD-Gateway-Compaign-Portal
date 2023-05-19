const {upload} = require(`${__utils}/file-uploader`);


module.exports = (router, controller) => {
  router.get("/getLists", controller.getLists);
  router.post(
    "/addLists",
    upload.single("users_list"),
    controller.addLists
  );
  router.delete("/deleteLists", controller.deleteLists);
};

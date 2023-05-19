let orderModel = {
  msisdn: 03075550011,
  balance: 15000,
  created_by: "john",
};

exports.getQoutaData = () => {
  return orderModel;
};
exports.setQoutaData = (data) => {
  for (let key of Object.keys(data)) {
    orderModel[key] = data[key];
  }
};

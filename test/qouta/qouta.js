require("../../app-globals");
const { describe, it, before, context, after } = require("mocha");
// const supertest = require('supertest');

const chai = require("chai");
const { expect } = chai;
chai.use(require("chai-http"));

let app = require(`${__root}/app`);

// const Order = require(`${__models}/order`).model;
const { getQoutaData, setQoutaData } = require("./test-data");
// const { transformOrder } = require(`${__controllers}/order`);
const { query } = require("../../src/config/sqlDatabase");

describe("Qouta API Routes", function () {
  describe("Add Qouta", () => {
    let qouta = getQoutaData();

    let id = 0;
    it("Should Add New Qouta (200)", async () => {
      let res = await chai.request(app).post("/api/v1/addQouta").send(qouta);
      id = res.body.data.insertId;
      expect(res).to.have.status(200);
      expect(res.body).property("success", true);
      setQoutaData(res.body["data"]);
    });

    after(async () => {
      await query(`DELETE FROM qouta WHERE id=${id}`);
    });

    it("Should return error data invalid (422)", async () => {
      let res = await chai.request(app).post("/api/v1/addQouta").send({});
      expect(res).to.have.status(422);
      expect(res.body).to.have.property("success", false);
    });
  });

  describe("Update Qouta", () => {
    let qouta = getQoutaData();
    let id = 0;

    // before(async () => {
    //   console.log("her");
    //   let result = await query(
    //     `INSERT INTO qouta (msisdn, balance, created_by) VALUES ('${qouta.msisdn}', '${qouta.balance}', '${qouta.created_by}');`
    //   );
    //   console.log("her", result);

    //   id = result.body.data.insertId;
    // });

    it("Should update qouta (200)", async () => {
      let result = await chai.request(app).post("/api/v1/addQouta").send(qouta);

      id = result.body.data.insertId;

      let res = await chai
        .request(app)
        .put(`/api/v1/updateQouta/${id}`)
        .send({ balance: qouta.balance });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
    });

    // after(async () => {
    //   await query(`DELETE FROM qouta WHERE id=${id}`);
    // });

    it("Should return error data invalid (422)", async () => {
      let res = await chai
        .request(app)
        .put(`/api/v1/updateQouta/${id}`)
        .send({});
      expect(res).to.have.status(422);
      expect(res.body).to.have.property("success", false);
    });

    it("Should return error not found (404)", async () => {
      let res = await chai
        .request(app)
        .put(`/api/v1/updateQouta/0`)
        .send({ balance: qouta.balance });

      expect(res).to.have.status(404);
      expect(res.body).to.have.property("success", false);
    });

    //  Test Case For user not found
    // it('Should return "404 Order Not Found" Error ', async () => {
    //   let res = await chai
    //     .request(app)
    //     .patch(
    //       `/api/v1/safety/media/enrollments/enrollment_id_not_exists/${order["data_order_id"]}`
    //     )
    //     .send({ status: "FETCHING_MEDIA" });
    //   expect(res).to.have.status(404);
    //   expect(res.body).to.have.property("success", false);
    // });

    // If Data Parameters are missing or invalid
    // it('Should Return "Data Invalid" Error', async () => {
    //     let res = await chai.request(app)
    //         .patch(`/api/v1/safety/media/enrollments/${order["enrollment_id"]}/`)
    //         .send({});
    //
    //     expect(res).to.have.status(422);
    //     expect(res.body).property("success", false);
    //     expect(res.body).property("errors").an("array");
    // });
  });

  //   //get
  //   describe("Fetch Order", () => {
  //     let order = getQoutaData();

  //     // Inserting required Data needed for test cases
  //     before(async () => {
  //       let tempOrder = await Order.create(order);
  //       setQoutaData({ data_order_id: tempOrder._id });
  //     });

  //     // Remove User on test completion
  //     after(async () => {
  //       await Order.deleteOne({ _id: order["data_order_id"] });
  //     });

  //     describe("Get Order ObjectID", () => {
  //       it("Should fetch single Order", async () => {
  //         let res = await chai
  //           .request(app)
  //           .get(
  //             `/api/v1/safety/media/enrollments/${order["enrollment_id"]}/${order["data_order_id"]}`
  //           );

  //         expect(res).to.have.status(200);
  //         expect(res.body.success).to.equals(true);
  //         expect(res.body.data).to.have.property("data_order");
  //       });

  //       it('Should Return "InValid ObjectID"', async () => {
  //         let res = await chai
  //           .request(app)
  //           .get(
  //             `/api/v1/safety/media/enrollments/${order["enrollment_id"]}/invalie_object_id`
  //           );

  //         expect(res).to.have.status(200);
  //         expect(res.body.success).to.equals(false);
  //       });

  //       it('Should Return "404 Order Not Found"', async () => {
  //         const res = await chai
  //           .request(require("../../app"))
  //           .get(
  //             `/api/v1/safety/media/enrollments/${order["enrollment_id"]}/5f75df94e67b8340a0f00c3a`
  //           );

  //         expect(res).to.have.status(404);
  //         expect(res.body.success).to.equals(false);
  //       });
  //     });
  //   });

  //   describe("TransForm Order", () => {
  //     let order = getQoutaData();

  //     it('Should Transform Order Dates to "Milliseconds"', async () => {
  //       let res = await transformOrder(order);
  //       expect(res.start_time).to.be.a("number");
  //       expect(res.end_time).to.be.a("number");
  //     });
  //   });

  //   describe("Process Order", () => {
  //     let order = getQoutaData();

  //     // Inserting required Data needed for test cases
  //     before(async () => {
  //       let tempOrder = await Order.create(order);
  //       setQoutaData({ data_order_id: tempOrder._id });
  //     });

  //     // Remove User on test completion
  //     // after(async () => {
  //     //     await Order.deleteOne({_id: order["data_order_id"]})
  //     // });

  //     it("Should Add New Order", async () => {
  //       let res = await chai
  //         .request(app)
  //         .post(`/api/v1/safety/media/process/order`)
  //         .send({
  //           enrollment_id: order.enrollment_id,
  //           data_order_id: order.data_order_id,
  //           driver_id:
  //             "8DiVTJ4Vqvc0raZyQIlNdu49WaiSOVOK94ZRwLqIPoIJJ0MbPYwsKfMIAAhcQKV3jfJFQcGqpmSnCPpO2lYVdCFJDGHtbdgC9ffcSoqiVJOY6mew4X_wj9cJK-uND9ikfg==",
  //         });

  //       expect(res).to.have.status(200);
  //       expect(res.body.success).to.equals(true);
  //     });
  //   });
});

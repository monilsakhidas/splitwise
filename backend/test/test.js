const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const assert = chai.assert;
const expect = chai.expect;
// Test variables
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkxvbGl0YSIsImVtYWlsIjoiZGVtbzFAZ21haWwuY29tIiwiY3VycmVuY3lJZCI6MiwiaWF0I" +
  "joxNjE1NzU5MDU3fQ.R1nEViofb3Zj8Xe0iHZIysylqasn_8WKGS4WcjlJEl4";
const groupName = "Updated Group Name";
const id = 1;

it("Should login and return a token if the credentials are correct", function (done) {
  chai
    .request("http://127.0.0.1:3001")
    .post("/users/login")
    .send({ email: "demo1@gmail.com", password: "abcd" })
    .end((err, res) => {
      expect(res).to.have.status(200);
      assert(JSON.parse(res.text).token != null);
      done();
    });
});

it("Should get all the currencies present in the database", function (done) {
  chai
    .request("http://127.0.0.1:3001")
    .get("/masters/currencies")
    .set("Authorization", "Bearer " + token)
    .end((err, res) => {
      expect(res).to.have.status(200);
      assert(JSON.parse(res.text).currencyList != null);
      assert(JSON.parse(res.text).currencyList.length != 0);
      done();
    });
});

it("Should not allow to fetch recent activity if the user isunauthorized or token is not set", function (done) {
  chai
    .request("http://127.0.0.1:3001")
    .get("/users/activity")
    .end((err, res) => {
      expect(res).to.have.status(401);
      assert(JSON.parse(res.text).errorMessage != null);
      done();
    });
});

it("Should update group name", function (done) {
  chai
    .request("http://127.0.0.1:3001")
    .put("/groups/editgroup")
    .set("Authorization", "Bearer " + token)
    .send({ name: groupName, id })
    .end((err, res) => {
      expect(res).to.have.status(200);
      assert(JSON.parse(res.text).name != null);
      assert(JSON.parse(res.text).name === groupName);
      assert(JSON.parse(res.text).id === id);
      done();
    });
});

it("Should fetch expenses of a group in which the logged in user is a member", function (done) {
  chai
    .request("http://127.0.0.1:3001")
    .get("/groups/expenses/" + id)
    .set("Authorization", "Bearer " + token)
    .end((err, res) => {
      expect(res).to.have.status(200);
      assert(JSON.parse(res.text).expenses != null);
      done();
    });
});

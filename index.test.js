const app = require("./index.js");
const mongoose = require("mongoose");
const supertest = require("supertest");

beforeEach((done) => {
  mongoose.connect("mongodb://localhost:27017/JestDB",
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => done());
});

afterEach((done) => {
  mongoose.connection.db.dropDatabase(() => {
    mongoose.connection.close(() => done())
  });
});

test("GET /collect/0800097-04.2017.8.10.0135", async () => {
  
    await supertest(app).get("/collect/0800097-04.2017.8.10.0135")
      .expect(200)
      .then((response) => {
        // Check type
        expect(typeof response.body == "object").toBeTruthy();
        // Check data
        expect().toBe(post.id);
      });
  });

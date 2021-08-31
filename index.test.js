const app = require("./index.js");
const supertest = require("supertest");

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

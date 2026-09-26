import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/common/lib/prisma";

describe("Auth API", () => {
  const uniqueId = Date.now();
  const testUser = {
    loginId: `usr${uniqueId}`.slice(0, 12),
    email: `test${uniqueId}@example.com`,
    password: "Test@1234!",
    confirmPassword: "Test@1234!",
    fullName: "Test User",
  };

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("POST /api/auth/signup", () => {
    it("creates a user with valid data", async () => {
      const res = await request(app).post("/api/auth/signup").send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty("loginId", testUser.loginId);
      expect(res.body.user).not.toHaveProperty("passwordHash");
    });

    it("rejects duplicate loginId", async () => {
      const res = await request(app).post("/api/auth/signup").send(testUser);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects short loginId (<6 chars)", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        ...testUser,
        loginId: "ab",
        email: "another@test.com",
      });
      expect(res.status).toBe(400);
    });

    it("rejects password without uppercase", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        ...testUser,
        loginId: "newuser1",
        email: "newuser@test.com",
        password: "nouppercase@1",
        confirmPassword: "nouppercase@1",
      });
      expect(res.status).toBe(400);
    });

    it("rejects password without special character", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        ...testUser,
        loginId: "newuser2",
        email: "newuser2@test.com",
        password: "NoSpecial123",
        confirmPassword: "NoSpecial123",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns tokens on valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ loginId: testUser.loginId, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
    });

    it("returns exact error message on wrong credentials (verbatim from wireframe)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ loginId: testUser.loginId, password: "WrongPass!99" });
      expect(res.status).toBe(401);
      // Exact message per docs/02 §2.1
      expect(res.body.error.message).toBe("Invalid Login Id or Password");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns user profile with valid token", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ loginId: testUser.loginId, password: testUser.password });
      const { accessToken } = loginRes.body;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.loginId).toBe(testUser.loginId);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });
});

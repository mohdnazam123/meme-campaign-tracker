// User model mock: database ko bilkul nahi chhuta.
// USER_ROLES hume khud dena padta hai, warna controller use khali dekhta hai.
jest.mock("../src/models/User", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn() },
  USER_ROLES: ["brand", "creator"],
}));

// require mocks ke BAAD, taaki app mock wala User hi dekhe
const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../src/app").default;
const User = require("../src/models/User").default;

process.env.JWT_SECRET = "test-secret";

const validBody = {
  name: "Brand One",
  email: "brand1@test.com",
  password: "secret123",
  role: "brand",
};

beforeEach(() => {
  User.findOne.mockReset();
  User.create.mockReset();
});

describe("POST /api/auth/signup", () => {
  it("creates a user and returns 201 without the password", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: "abc123",
      name: "Brand One",
      email: "brand1@test.com",
      role: "brand",
    });

    const res = await request(app).post("/api/auth/signup").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Signup successful");
    expect(res.body.user).toEqual({
      id: "abc123",
      name: "Brand One",
      email: "brand1@test.com",
      role: "brand",
    });
    expect(res.body.user.password).toBeUndefined();

    // Password plain text me save nahi hona chahiye, bcrypt hash hona chahiye
    const savedData = User.create.mock.calls[0][0];
    expect(savedData.password).not.toBe("secret123");
    expect(savedData.password).toMatch(/^\$2[aby]\$/);
  });

  it.each(["name", "email", "password", "role"])(
    "returns 400 when %s is missing",
    async (field) => {
      const body: Record<string, string> = { ...validBody };
      delete body[field];

      const res = await request(app).post("/api/auth/signup").send(body);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "name, email, password and role are required"
      );
      expect(User.create).not.toHaveBeenCalled();
    }
  );

  it("returns 400 when the password is shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validBody, password: "12345" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password must be at least 6 characters");
    expect(User.create).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid role", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validBody, role: "admin" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Role must be either brand or creator");
    expect(User.create).not.toHaveBeenCalled();
  });

  it("returns 409 when the email is already registered", async () => {
    User.findOne.mockResolvedValue({ _id: "existing" });

    const res = await request(app).post("/api/auth/signup").send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already registered");
    expect(User.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/login", () => {
  // Controller findOne(...).select("+password") likhta hai, isliye chain mock
  const mockFindOneWithSelect = (user: unknown) => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
  };

  const fakeUser = {
    _id: "abc123",
    name: "Brand One",
    email: "brand1@test.com",
    role: "brand",
    password: bcrypt.hashSync("secret123", 4),
  };

  it("returns 200 with a valid token for correct credentials", async () => {
    mockFindOneWithSelect(fakeUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "brand1@test.com", password: "secret123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toEqual({
      id: "abc123",
      name: "Brand One",
      email: "brand1@test.com",
      role: "brand",
    });
    expect(res.body.user.password).toBeUndefined();

    const payload = jwt.verify(res.body.token, "test-secret");
    expect(payload.userId).toBe("abc123");
    expect(payload.role).toBe("brand");
  });

  it("returns 401 for an incorrect password", async () => {
    mockFindOneWithSelect(fakeUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "brand1@test.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
    expect(res.body.token).toBeUndefined();
  });

  it("returns 401 for an unknown email", async () => {
    mockFindOneWithSelect(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "secret123" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });
});
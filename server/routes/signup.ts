import { RequestHandler } from "express";

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: string;
}

export const handleSignup: RequestHandler = async (req, res) => {
  const { name, email, password, confirmPassword, age, gender } = req.body as SignupRequest;

  // Validation
  if (!name || !email || !password || !confirmPassword || !age || !gender) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 13) {
    res.status(400).json({ error: "You must be at least 13 years old" });
    return;
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Dummy signup success response
  res.status(200).json({
    success: true,
    message: "Account created successfully",
    user: {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      age: ageNum,
      gender,
      createdAt: new Date().toISOString(),
    },
  });
};

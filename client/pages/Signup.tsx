import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogIn, Mail, Lock, User, Calendar, Venus, Mars } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      gender: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Basic validation
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword ||
        !formData.age ||
        !formData.gender
      ) {
        setError("Please fill in all fields");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError("Please enter a valid email");
        return;
      }

      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 13) {
        setError("You must be at least 13 years old");
        return;
      }

      // Prepare payload
      const payload = {
        name: formData.name,
        email: formData.email,
        createPassword: formData.password,
        confirmPassword: formData.confirmPassword,
        age: ageNum,
        gender: formData.gender,
      };

      const response = await fetch("/webhook/sign-up-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        // Show message returned by API if available
        setError(data?.message || "Signup failed. Please try again.");
        return;
      }

      // Store token if returned
      if (data.token) {
        login(data.token);
        navigate("/home");
      } else {
        setError("Token not returned from API");
        return;
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");

  //   // Validation
  //   if (
  //     !formData.name ||
  //     !formData.email ||
  //     !formData.password ||
  //     !formData.confirmPassword ||
  //     !formData.age ||
  //     !formData.gender
  //   ) {
  //     setError("Please fill in all fields");
  //     return;
  //   }

  //   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
  //     setError("Please enter a valid email");
  //     return;
  //   }

  //   if (formData.password.length < 8) {
  //     setError("Password must be at least 8 characters");
  //     return;
  //   }

  //   if (formData.password !== formData.confirmPassword) {
  //     setError("Passwords do not match");
  //     return;
  //   }

  //   const ageNum = parseInt(formData.age);
  //   if (isNaN(ageNum) || ageNum < 13) {
  //     setError("You must be at least 13 years old");
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     // Call dummy signup API
  //     const response = await fetch("http://localhost:5678/webhook/sign-up-user", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(formData),
  //     });

  //     if (response.status === 200) {
  //       // Navigate to chat page on success
  //       navigate("/chat");
  //     } else {
  //       setError("Signup failed. Please try again.");
  //     }
  //   } catch (err) {
  //     setError("An error occurred. Please try again.");
  //     console.error("Signup error:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Signup Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-br from-primary/10 to-secondary/10 border-b border-border">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 py-8">
            {/* Title */}
            <div className="text-center mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Create Account
              </h1>
            </div>

            <p className="text-center text-muted-foreground text-sm mb-8">
              Join us and start your journey
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 h-11 border-border focus:border-primary focus:ring-primary bg-input text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-11 border-border focus:border-primary focus:ring-primary bg-input text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11 border-border focus:border-primary focus:ring-primary bg-input text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors text-xs"
                    disabled={isLoading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11 border-border focus:border-primary focus:ring-primary bg-input text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors text-xs"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Age Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="age"
                  className="text-sm font-medium text-foreground"
                >
                  Age
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="pl-10 h-11 border-border focus:border-primary focus:ring-primary bg-input text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                    min="13"
                  />
                </div>
              </div>

              {/* Gender Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="gender"
                  className="text-sm font-medium text-foreground"
                >
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={handleGenderChange}
                >
                  <SelectTrigger className="h-11 border-border focus:border-primary focus:ring-primary bg-input text-foreground">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">
                      <div className="flex items-center gap-2">
                        <Mars className="w-4 h-4" />
                        Male
                      </div>
                    </SelectItem>
                    <SelectItem value="female">
                      <div className="flex items-center gap-2">
                        <Venus className="w-4 h-4" />
                        Female
                      </div>
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-lg transition-all mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link
                to="/"
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

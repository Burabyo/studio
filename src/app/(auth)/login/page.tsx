
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, UserRole } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { PaypulseIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";

const taglines = [
  "The simple, secure, and intelligent way to manage your payroll.",
  "Precision payroll, simplified.",
  "Empowering your business, one payslip at a time.",
  "Your trusted partner in payroll management.",
];

export default function LoginPage() {
  const { signup, login, loading } = useAuth();
  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<UserRole>("admin");
  const [currentTagline, setCurrentTagline] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 5000); // Change tagline every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
      router.push('/dashboard');
      toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (error: any) {
      const errorMessage = error.code ? error.code.replace('auth/', '').replace(/-/g, ' ') : 'An unknown error occurred.';
      toast({ variant: "destructive", title: "Login Failed", description: `Error: ${errorMessage}` });
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(signupEmail, signupPassword, signupName, signupRole);
      router.push('/dashboard');
      toast({ title: "Account Created", description: "Welcome to PayPulse!" });
    } catch (error: any) {
       const errorMessage = error.code ? error.code.replace('auth/', '').replace(/-/g, ' ') : 'An unknown error occurred.';
       toast({ variant: "destructive", title: "Sign-up Failed", description: `Error: ${errorMessage}. Please check your details.` });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg text-center"
      >
        <div className="flex flex-col items-center justify-center mb-6">
          <PaypulseIcon className="w-20 h-20 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight mt-4">Welcome to PayPulse</h1>
           <motion.p 
              key={currentTagline}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-2 h-10"
            >
              {taglines[currentTagline]}
            </motion.p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl font-normal">Login to your account</CardTitle>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}/>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl font-normal">Create an Account</CardTitle>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" type="text" placeholder="John Doe" required value={signupName} onChange={(e) => setSignupName(e.target.value)}/>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="m@example.com" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}/>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}/>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label>Role</Label>
                    <RadioGroup 
                      defaultValue={signupRole} 
                      onValueChange={(value) => setSignupRole(value as UserRole)}
                      className="flex items-center space-x-4 pt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="admin" />
                        <Label htmlFor="admin">Admin</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manager" id="manager" />
                        <Label htmlFor="manager">Manager</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="employee" id="employee" />
                        <Label htmlFor="employee">Employee</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
      <div className="absolute bottom-5 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PayPulse Inc. All Rights Reserved.
      </div>
    </div>
  );
}

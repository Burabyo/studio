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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";

const taglines = [
  "The simple, secure, and intelligent way to manage your payroll.",
  "Precision payroll, simplified for you.",
  "Empowering your business, one payslip at a time.",
  "Smart payroll for the modern workforce."
];

export default function LoginPage() {
  const { signup, login, loading } = useAuth();
  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<UserRole>("admin");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prevIndex) => (prevIndex + 1) % taglines.length);
    }, 4000); // Change tagline every 4 seconds
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
    if (signupPassword !== signupConfirmPassword) {
      toast({ variant: "destructive", title: "Sign-up Failed", description: "Passwords do not match." });
      return;
    }

    try {
      await signup(signupEmail, signupPassword, signupName, signupRole);
      router.push('/dashboard');
      toast({ title: "Account Created", description: "Welcome to PayPulse!" });
    } catch (error: any)       const errorMessage = error.code ? error.code.replace('auth/', '').replace(/-/g, ' ') : 'An unknown error occurred.';
       toast({ variant: "destructive", title: "Sign-up Failed", description: `Error: ${errorMessage}. Please check your details.` });
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center bg-muted p-10 text-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10"
        >
          <PaypulseIcon className="w-24 h-24 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome to PayPulse
          </h1>
          <div className="mt-4 text-lg text-muted-foreground h-12">
            <AnimatePresence mode="wait">
              <motion.p
                key={taglineIndex}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                {taglines[taglineIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
         {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-5">
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/20 rounded-full blur-3xl"></div>
        </div>
      </div>
       <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[380px] gap-6">
            <div className="grid gap-2 text-center lg:hidden">
                <PaypulseIcon className="w-16 h-16 text-primary mb-4 mx-auto" />
                <h1 className="text-3xl font-bold tracking-tight">Welcome to PayPulse</h1>
            </div>
            
             <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <Card className="border-none shadow-none">
                    <form onSubmit={handleLogin}>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Login to your account</CardTitle>
                            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="login-password">Password</Label>
                             <div className="relative">
                                <Input 
                                    id="login-password" 
                                    type={showLoginPassword ? "text" : "password"}
                                    required 
                                    value={loginPassword} 
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                                    onClick={() => setShowLoginPassword(prev => !prev)}
                                >
                                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
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
                    <Card className="border-none shadow-none">
                    <form onSubmit={handleSignup}>
                         <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Create an account</CardTitle>
                            <CardDescription>Get started with PayPulse in seconds.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="signup-name">Full Name</Label>
                                <Input id="signup-name" type="text" placeholder="John Doe" required value={signupName} onChange={(e) => setSignupName(e.target.value)}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input id="signup-email" type="email" placeholder="m@example.com" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <div className="relative">
                                    <Input 
                                        id="signup-password" 
                                        type={showSignupPassword ? "text" : "password"}
                                        required 
                                        value={signupPassword} 
                                        onChange={(e) => setSignupPassword(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                                        onClick={() => setShowSignupPassword(prev => !prev)}
                                    >
                                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                                 <div className="relative">
                                    <Input 
                                        id="signup-confirm-password" 
                                        type={showConfirmPassword ? "text" : "password"}
                                        required 
                                        value={signupConfirmPassword} 
                                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(prev => !prev)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
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
        </div>
      </div>
    </div>
  );
}

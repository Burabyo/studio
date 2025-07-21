
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { PaypulseIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { signup, login, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [activeSignupTab, setActiveSignupTab] = useState("signupAdmin");


  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupCompanyName, setSignupCompanyName] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  

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
      const isAdminSignup = activeSignupTab === 'signupAdmin';
      
      await signup({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        isAdmin: isAdminSignup,
        companyName: signupCompanyName,
        employeeId: employeeId,
      });
     
      router.push('/dashboard');
      toast({ title: "Account Created", description: "Welcome to PayPulse!" });
    } catch (error: any) {
       const errorMessage = error.message || (error.code ? error.code.replace('auth/', '').replace(/-/g, ' ') : 'An unknown error occurred.');
       toast({ variant: "destructive", title: "Sign-up Failed", description: `${errorMessage}.` });
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center bg-background p-8">
          <div className="grid gap-4 text-center max-w-md">
              <PaypulseIcon className="w-24 h-24 text-primary mb-4 mx-auto" />
              <h1 className="text-4xl font-bold tracking-tight">Welcome to PayPulse</h1>
              <p className="text-xl text-muted-foreground">
                  The simple, secure, and intelligent way to manage your payroll.
              </p>
          </div>
      </div>
       <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
            <div className="w-full max-w-xl">
                <div className="lg:hidden grid gap-2 text-center mb-8">
                    <PaypulseIcon className="w-16 h-16 text-primary mb-4 mx-auto" />
                    <h1 className="text-3xl font-bold tracking-tight">Welcome to PayPulse</h1>
                </div>
                <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-6 pt-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold tracking-tight">Login to your account</h2>
                                <p className="text-muted-foreground">Enter your credentials to access your dashboard.</p>
                            </div>
                            <div className="grid gap-4">
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
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </form>
                    </TabsContent>
                    <TabsContent value="signup">
                        <Tabs defaultValue="signupAdmin" className="w-full" onValueChange={setActiveSignupTab}>
                             <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="signupAdmin">Create Company</TabsTrigger>
                                <TabsTrigger value="signupEmployee">Join Company</TabsTrigger>
                            </TabsList>
                             <TabsContent value="signupAdmin">
                                <form onSubmit={handleSignup} className="space-y-6 pt-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold tracking-tight">Create a new Company Account</h2>
                                        <p className="text-muted-foreground">Sign up as an administrator to get started.</p>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="signup-company-name">Company Name</Label>
                                            <Input 
                                                id="signup-company-name" 
                                                type="text" 
                                                placeholder="Your Company Inc." 
                                                required 
                                                value={signupCompanyName} 
                                                onChange={(e) => setSignupCompanyName(e.target.value)}
                                            />
                                        </div>
                                         <div className="grid gap-2">
                                            <Label htmlFor="signup-name-admin">Full Name</Label>
                                            <Input id="signup-name-admin" type="text" placeholder="John Doe" required value={signupName} onChange={(e) => setSignupName(e.target.value)}/>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="signup-email-admin">Email</Label>
                                            <Input id="signup-email-admin" type="email" placeholder="m@example.com" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}/>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="signup-password-admin">Password</Label>
                                             <div className="relative">
                                                <Input 
                                                    id="signup-password-admin" 
                                                    type={showSignupPassword ? "text" : "password"}
                                                    required 
                                                    value={signupPassword} 
                                                    onChange={(e) => setSignupPassword(e.target.value)}
                                                />
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent" onClick={() => setShowSignupPassword(prev => !prev)}>
                                                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="signup-confirm-password-admin">Confirm Password</Label>
                                            <div className="relative">
                                                <Input 
                                                    id="signup-confirm-password-admin" 
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    required 
                                                    value={signupConfirmPassword} 
                                                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                                />
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent" onClick={() => setShowConfirmPassword(prev => !prev)}>
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Company Account
                                    </Button>
                                </form>
                            </TabsContent>
                             <TabsContent value="signupEmployee">
                                 <form onSubmit={handleSignup} className="space-y-6 pt-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold tracking-tight">Join an existing Company</h2>
                                        <p className="text-muted-foreground">Sign up using the Employee ID provided by your administrator.</p>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="signup-employee-id">Employee ID</Label>
                                            <Input 
                                                id="signup-employee-id" 
                                                type="text" 
                                                placeholder="Your unique employee ID" 
                                                required 
                                                value={employeeId} 
                                                onChange={(e) => setEmployeeId(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="signup-name-employee">Full Name</Label>
                                            <Input id="signup-name-employee" type="text" placeholder="John Doe" required value={signupName} onChange={(e) => setSignupName(e.target.value)}/>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="signup-email-employee">Email</Label>
                                            <Input id="signup-email-employee" type="email" placeholder="m@example.com" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}/>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="signup-password-employee">Password</Label>
                                             <div className="relative">
                                                <Input 
                                                    id="signup-password-employee" 
                                                    type={showSignupPassword ? "text" : "password"}
                                                    required 
                                                    value={signupPassword} 
                                                    onChange={(e) => setSignupPassword(e.target.value)}
                                                />
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent" onClick={() => setShowSignupPassword(prev => !prev)}>
                                                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="signup-confirm-password-employee">Confirm Password</Label>
                                            <div className="relative">
                                                <Input 
                                                    id="signup-confirm-password-employee" 
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    required 
                                                    value={signupConfirmPassword} 
                                                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                                />
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent" onClick={() => setShowConfirmPassword(prev => !prev)}>
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Join Company
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>
            </div>
      </div>
    </div>
  );
}

    
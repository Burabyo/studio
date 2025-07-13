
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, UserRole } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { PaypulseIcon } from "@/components/icons";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (role: UserRole) => {
    login(role);
    router.push('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
            <PaypulseIcon className="w-12 h-12 mb-2"/>
            <CardTitle className="text-2xl">Welcome to PayPulse</CardTitle>
            <CardDescription>Select a role to simulate login</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => handleLogin('admin')}>
                Login as Admin
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => handleLogin('manager')}>
                Login as Manager
            </Button>
            <Button className="w-full" variant="outline" onClick={() => handleLogin('employee')}>
                Login as Employee (Alice Johnson)
            </Button>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-center text-muted-foreground">
                This is a simulated login. No real authentication is performed.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

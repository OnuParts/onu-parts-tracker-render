
import React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import onuLogoPath from "@/assets/onu-logo.svg";

// Adding explicit React import to help Vite React plugin detect preamble

const Login = () => {
  const [_, navigate] = useLocation();
  const { user, loginMutation } = useAuth();
  const [loginType, setLoginType] = useState<'admin' | 'student'>('admin');

  useEffect(() => {
    if (user && !loginMutation.isLoading) {
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else if (user.role === 'technician') {
        navigate('/parts-issuance');
      } else if (user.role === 'student') {
        navigate('/parts-inventory');
      }
    }
  }, [user, loginMutation.isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      await loginMutation.mutateAsync({ 
        username, 
        password,
        role: loginType
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return React.createElement("div", { 
    className: "flex min-h-screen items-center justify-center bg-background p-4" 
  }, 
    React.createElement(Card, { className: "w-full max-w-md" },
      React.createElement(CardHeader, { className: "space-y-1" },
        React.createElement("div", { className: "flex justify-center mb-4" },
          React.createElement("img", { src: onuLogoPath, alt: "ONU Logo", className: "h-16" })
        ),
        React.createElement(CardTitle, { className: "text-2xl text-center" }, "Login"),
        React.createElement(CardDescription, { className: "text-center" }, "Enter your credentials to continue")
      ),
      React.createElement(CardContent, null,
        React.createElement("div", { className: "flex justify-center space-x-4 mb-4" },
          React.createElement(Button, { 
            type: "button", 
            variant: loginType === 'admin' ? 'default' : 'outline',
            onClick: () => setLoginType('admin')
          }, "Admin Login"),
          React.createElement(Button, { 
            type: "button", 
            variant: loginType === 'student' ? 'default' : 'outline',
            onClick: () => setLoginType('student')
          }, "Student Login")
        ),
        React.createElement("form", { onSubmit: handleLogin, className: "space-y-4" },
          React.createElement("div", { className: "space-y-2" },
            React.createElement(Label, { htmlFor: "username" }, "Username"),
            React.createElement(Input, { id: "username", name: "username", required: true })
          ),
          React.createElement("div", { className: "space-y-2" },
            React.createElement(Label, { htmlFor: "password" }, "Password"),
            React.createElement(Input, { id: "password", name: "password", type: "password", required: true })
          ),
          React.createElement(Button, { type: "submit", className: "w-full" },
            React.createElement(LogIn, { className: "mr-2 h-4 w-4" }),
            `Login as ${loginType === 'admin' ? 'Administrator' : 'Student'}`
          )
        )
      )
    )
  );
};

export default Login;

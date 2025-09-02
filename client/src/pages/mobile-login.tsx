import React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import onuLogoPath from "@/assets/onu-logo.svg";
import { User } from "@shared/schema";

// Adding explicit React import to help Vite React plugin detect preamble

const MobileLogin = () => {
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Function to get last name for sorting
  const getLastName = (fullName: string): string => {
    const nameParts = fullName.trim().split(' ');
    return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
  };
  
  useEffect(() => {
    async function fetchTechnicians() {
      setIsLoading(true);
      try {
        console.log("Fetching technicians for mobile login");
        const response = await fetch("/api/technicians-list");
        
        if (!response.ok) {
          console.error(`Error response: ${response.status}`);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log(`Found ${data.length} technicians`);
        
        if (Array.isArray(data) && data.length > 0) {
          // Sort technicians by last name
          const sortedTechnicians = [...data].sort((a, b) => {
            const lastNameA = getLastName(a.name);
            const lastNameB = getLastName(b.name);
            return lastNameA.localeCompare(lastNameB);
          });
          setTechnicians(sortedTechnicians);
        } else {
          console.warn("No technicians found or data is not an array");
        }
      } catch (err) {
        console.error("Error fetching technicians:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTechnicians();
  }, []);

  const handleTechnicianClick = async (techId: number) => {
    console.log(`Mobile login form submit for technician ID: ${techId}`);
    
    try {
      setIsLoading(true);
      
      // Use fetch API instead of form submission for better control
      const response = await fetch('/api/mobile-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          techId: techId.toString()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${response.status}`, errorText);
        alert("Login failed: " + errorText);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log("Login successful:", data);
      
      // Redirect to parts issuance
      window.location.href = '/parts-issuance';
    } catch (err) {
      console.error("Error during login:", err);
      alert("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  // We're replacing JSX with React.createElement to fix the Vite plugin issue
  return React.createElement(
    "div", 
    { className: "flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4" },
    React.createElement(
      "div", 
      { className: "w-full max-w-md" },
      React.createElement(
        "div", 
        { className: "flex justify-center mb-6" },
        React.createElement("img", { src: onuLogoPath, alt: "ONU Logo", className: "h-16" })
      ),
      React.createElement("h1", { className: "text-2xl font-bold text-center mb-2" }, "ONU Parts Tracker"),
      React.createElement("p", { className: "text-center text-gray-500 mb-6" }, "Mobile Login"),
      
      // Student Login Card
      React.createElement(
        Card, 
        { className: "mb-4" },
        React.createElement(
          CardHeader,
          { className: "pb-2" },
          React.createElement(CardTitle, { className: "text-lg" }, "Student Worker Login"),
          React.createElement(CardDescription, null, "Access Parts Inventory")
        ),
        React.createElement(
          CardContent,
          null,
          React.createElement(
            "form",
            { action: "/api/login", method: "POST", className: "space-y-2" },
            React.createElement("input", { type: "hidden", name: "role", value: "student" }),
            React.createElement(
              "div",
              { className: "grid gap-2" },
              React.createElement("label", { className: "text-sm font-medium" }, "Username"),
              React.createElement("input", {
                type: "text",
                name: "username",
                placeholder: "Student",
                className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
                required: true
              })
            ),
            React.createElement(
              "div",
              { className: "grid gap-2" },
              React.createElement("label", { className: "text-sm font-medium" }, "Password"),
              React.createElement("input", {
                type: "password",
                name: "password",
                placeholder: "••••••••",
                className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
                required: true
              })
            ),
            React.createElement(Button, { type: "submit", className: "w-full" }, "Login as Student Worker")
          )
        )
      ),
      
      // Technician Login Card
      React.createElement(
        Card,
        null,
        React.createElement(
          CardHeader,
          { className: "pb-2" },
          React.createElement(CardTitle, { className: "text-lg" }, "Technician Login"),
          React.createElement(CardDescription, null, "Select your name to access Parts Issuance")
        ),
        React.createElement(
          CardContent,
          null,
          isLoading
            ? React.createElement(
                "div",
                { className: "flex justify-center p-6" },
                React.createElement("div", {
                  className: "animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"
                })
              )
            : technicians.length > 0
            ? React.createElement(
                "div",
                { className: "grid grid-cols-1 gap-2" },
                technicians.map((tech) =>
                  React.createElement(
                    Button,
                    {
                      key: tech.id,
                      variant: "outline",
                      className: "justify-start p-3 h-auto text-left",
                      onClick: () => handleTechnicianClick(tech.id)
                    },
                    React.createElement(
                      "div",
                      { className: "flex flex-col" },
                      React.createElement("span", { className: "font-medium" }, tech.name),
                      React.createElement(
                        "span",
                        { className: "text-xs text-gray-500" },
                        tech.department || "No Department"
                      )
                    )
                  )
                )
              )
            : React.createElement(
                "div",
                { className: "text-center p-4" },
                React.createElement("p", { className: "text-gray-500" }, "No technicians found")
              )
        )
      ),
      
      // Footer
      React.createElement(
        "div",
        { className: "mt-4 text-center" },
        React.createElement(
          "a",
          { href: "/login", className: "text-sm text-primary hover:underline" },
          "Switch to Regular Login"
        )
      )
    )
  );
};

export default MobileLogin;
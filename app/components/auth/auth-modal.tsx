"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import SignupForm from "./signup-form"; // Import your new default export

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "signup";
}

export function AuthModal({
  open,
  onOpenChange,
  defaultTab = "login",
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);

  useEffect(() => {
    // Each time the modal re-opens, pick the parent's defaultTab
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {activeTab === "login" ? "Welcome back" : "Create an account"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === "login"
              ? "Enter your email and password to sign in."
              : "Enter your details to create a new account."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          // Fully controlled
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "login" | "signup")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <LoginForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            {/* The new SignupForm does its own redirect to Stripe,
                so we don't pass onSuccess here. */}
            <SignupForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AccountTypeSelection() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/signup?type=student");
  }, []);

  return null;
}

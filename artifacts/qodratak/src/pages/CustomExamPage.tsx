import { useEffect } from "react";
import { useLocation } from "wouter";

const CustomExamPage = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  return null;
};

export default CustomExamPage;
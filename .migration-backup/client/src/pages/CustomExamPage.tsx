import { useLocation } from "wouter";

const CustomExamPage = () => {
  const [, setLocation] = useLocation();

  // Redirect to home since this feature is removed
  setLocation("/");

  return null;
};

export default CustomExamPage;
import QiyasExamPage, { type CustomExamConfiguration } from "./QiyasExamPage";

const configurations: Record<"verbal" | "quantitative", CustomExamConfiguration> = {
  verbal: {
    id: 11, name: "الاختبار اللفظي اليومي", verbalCount: 20, quantitativeCount: 0, timeLimit: 20,
    questionEndpoint: "/api/questions/free-test/verbal", testType: "free-verbal",
  },
  quantitative: {
    id: 12, name: "الاختبار الكمي اليومي", verbalCount: 0, quantitativeCount: 20, timeLimit: 20,
    questionEndpoint: "/api/questions/free-test/quantitative", testType: "free-quantitative",
  },
};

export default function DailyExamPage({ category }: { category: "verbal" | "quantitative" }) {
  return <QiyasExamPage customConfiguration={configurations[category]} />;
}

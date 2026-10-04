import { useEffect, useState } from "react";
import { BookOpen, Calculator, X } from "lucide-react";
import formulasImg from "@assets/Screenshot_2026-03-08_071500_1772943315708.png";

export type ExamStudyTool = "laws" | "calculator";

interface ExamStudyToolsProps {
  tool: ExamStudyTool;
  onClose: () => void;
}

const geometryFormulas = [
  {
    title: "المثلث",
    formulas: ["المساحة = (القاعدة × الارتفاع) ÷ ٢", "مجموع الزوايا = ١٨٠°", "في القائم: الوتر² = الضلع الأول² + الضلع الثاني²"],
  },
  {
    title: "المربع والمستطيل",
    formulas: ["مساحة المربع = الضلع²", "محيط المربع = ٤ × الضلع", "مساحة المستطيل = الطول × العرض", "محيطه = ٢ × (الطول + العرض)"],
  },
  {
    title: "الدائرة",
    formulas: ["المساحة = π × نق²", "المحيط = ٢ × π × نق"],
  },
  {
    title: "أشكال أخرى",
    formulas: ["متوازي الأضلاع: المساحة = القاعدة × الارتفاع", "شبه المنحرف: المساحة = ((القاعدة الكبرى + الصغرى) × الارتفاع) ÷ ٢"],
  },
  {
    title: "المجسمات",
    formulas: ["متوازي المستطيلات: الحجم = الطول × العرض × الارتفاع", "الأسطوانة: الحجم = π × نق² × الارتفاع"],
  },
];

const multiplicationLaws = [
  {
    title: "خاصية الإبدال",
    formula: "أ × ب = ب × أ",
    example: "٤ × ٧ = ٧ × ٤",
  },
  {
    title: "خاصية التجميع",
    formula: "(أ × ب) × ج = أ × (ب × ج)",
    example: "(٢ × ٣) × ٥ = ٢ × (٣ × ٥)",
  },
  {
    title: "خاصية التوزيع",
    formula: "أ × (ب + ج) = (أ × ب) + (أ × ج)",
    example: "٣ × (٤ + ٢) = (٣ × ٤) + (٣ × ٢)",
  },
  {
    title: "العنصر المحايد والصفر",
    formula: "أ × ١ = أ   ·   أ × ٠ = ٠",
    example: "الضرب في ١ لا يغيّر العدد، والضرب في ٠ ناتجه صفر.",
  },
];

function formatExpression(expression: string) {
  return expression
    .replaceAll("sqrt(", "√(")
    .replaceAll("*", " × ")
    .replaceAll("/", " ÷ ")
    .replaceAll("-", " − ");
}

function evaluateScientificExpression(source: string): number {
  const expression = source
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .replace(/\s/g, "");

  if (!expression || expression.length > 100) {
    throw new Error("عملية غير صالحة");
  }

  const tokenPattern = /\d+(?:\.\d*)?|\.\d+|sqrt|π|[()+\-*/^]/gy;
  const tokens: string[] = [];
  let offset = 0;

  while (offset < expression.length) {
    tokenPattern.lastIndex = offset;
    const match = tokenPattern.exec(expression);
    if (!match) throw new Error("عملية غير صالحة");
    tokens.push(match[0]);
    offset = tokenPattern.lastIndex;
  }

  let cursor = 0;

  const parseExpression = (): number => {
    let value = parseTerm();
    while (tokens[cursor] === "+" || tokens[cursor] === "-") {
      const operator = tokens[cursor++];
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parseUnary();
    while (tokens[cursor] === "*" || tokens[cursor] === "/") {
      const operator = tokens[cursor++];
      const right = parseUnary();
      if (operator === "/" && right === 0) throw new Error("لا يمكن القسمة على صفر");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };

  const parseUnary = (): number => {
    if (tokens[cursor] === "+") {
      cursor++;
      return parseUnary();
    }
    if (tokens[cursor] === "-") {
      cursor++;
      return -parseUnary();
    }
    return parsePower();
  };

  const parsePower = (): number => {
    const base = parsePrimary();
    if (tokens[cursor] === "^") {
      cursor++;
      return base ** parseUnary();
    }
    return base;
  };

  const parsePrimary = (): number => {
    const token = tokens[cursor++];
    if (token === undefined) throw new Error("عملية غير مكتملة");

    if (token === "(") {
      const value = parseExpression();
      if (tokens[cursor++] !== ")") throw new Error("أغلق الأقواس أولاً");
      return value;
    }

    if (token === "sqrt") {
      if (tokens[cursor++] !== "(") throw new Error("أدخل العدد داخل قوسين");
      const value = parseExpression();
      if (tokens[cursor++] !== ")") throw new Error("أغلق الأقواس أولاً");
      if (value < 0) throw new Error("الجذر التربيعي لعدد سالب غير حقيقي");
      return Math.sqrt(value);
    }

    if (token === "π") return Math.PI;

    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error("عملية غير صالحة");
    return value;
  };

  const value = parseExpression();
  if (cursor !== tokens.length || !Number.isFinite(value)) {
    throw new Error("تحقق من العملية");
  }
  return value;
}

function formatResult(value: number) {
  return String(Number(value.toPrecision(12)));
}

type CalculatorKey = {
  label: string;
  token?: string;
  action?: "clear" | "backspace" | "equals" | "square" | "sqrt";
  tone?: "operator" | "utility" | "equals";
};

const calculatorKeys: CalculatorKey[][] = [
  [
    { label: "C", action: "clear", tone: "utility" },
    { label: "⌫", action: "backspace", tone: "utility" },
    { label: "(", token: "(" },
    { label: ")", token: ")" },
  ],
  [
    { label: "√", action: "sqrt", tone: "operator" },
    { label: "x²", action: "square", tone: "operator" },
    { label: "^", token: "^", tone: "operator" },
    { label: "÷", token: "/", tone: "operator" },
  ],
  [
    { label: "٧", token: "7" },
    { label: "٨", token: "8" },
    { label: "٩", token: "9" },
    { label: "×", token: "*", tone: "operator" },
  ],
  [
    { label: "٤", token: "4" },
    { label: "٥", token: "5" },
    { label: "٦", token: "6" },
    { label: "−", token: "-", tone: "operator" },
  ],
  [
    { label: "١", token: "1" },
    { label: "٢", token: "2" },
    { label: "٣", token: "3" },
    { label: "+", token: "+", tone: "operator" },
  ],
  [
    { label: "π", token: "π", tone: "operator" },
    { label: "٠", token: "0" },
    { label: ".", token: "." },
    { label: "=", action: "equals", tone: "equals" },
  ],
];

function ScientificCalculator() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const appendToken = (token: string) => {
    setExpression((current) => {
      const base = result
        ? (["+", "-", "*", "/", "^"].includes(token) ? result : "")
        : current;
      return `${base}${token}`;
    });
    setResult("");
    setError("");
  };

  const handleKey = (key: CalculatorKey) => {
    if (key.action === "clear") {
      setExpression("");
      setResult("");
      setError("");
      return;
    }
    if (key.action === "backspace") {
      setExpression((current) => (result ? result.slice(0, -1) : current.slice(0, -1)));
      setResult("");
      setError("");
      return;
    }
    if (key.action === "square") {
      const base = result || expression;
      if (!base) return;
      setExpression(`${base}^2`);
      setResult("");
      setError("");
      return;
    }
    if (key.action === "sqrt") {
      const base = result || expression;
      setExpression(base ? `sqrt(${base})` : "sqrt(");
      setResult("");
      setError("");
      return;
    }
    if (key.action === "equals") {
      try {
        setResult(formatResult(evaluateScientificExpression(expression)));
        setError("");
      } catch (cause) {
        setResult("");
        setError(cause instanceof Error ? cause.message : "تحقق من العملية");
      }
      return;
    }
    if (key.token) appendToken(key.token);
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-left text-white shadow-inner" dir="ltr" aria-live="polite">
        <div className="min-h-7 break-all text-sm text-slate-300">
          {expression ? formatExpression(expression) : "٠"}
        </div>
        <div className="mt-1 min-h-9 break-all text-2xl font-bold tabular-nums">
          {result ? `= ${result}` : <span className="text-transparent">0</span>}
        </div>
        {error && <p className="mt-1 text-right text-xs text-rose-300" dir="rtl">{error}</p>}
      </div>

      <div className="grid gap-2">
        {calculatorKeys.map((row, rowIndex) => (
          <div className="grid grid-cols-4 gap-2" key={rowIndex}>
            {row.map((key) => (
              <button
                key={key.label}
                type="button"
                onClick={() => handleKey(key)}
                aria-label={key.action === "backspace" ? "حذف آخر رقم" : key.label}
                className={`min-h-12 rounded-xl border text-base font-bold transition-colors active:scale-[0.98] ${
                  key.tone === "equals"
                    ? "border-teal-600 bg-teal-600 text-white hover:bg-teal-700"
                    : key.tone === "operator"
                      ? "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                      : key.tone === "utility"
                        ? "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {key.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExamStudyToolsDialog({ tool, onClose }: ExamStudyToolsProps) {
  const [activeLawTab, setActiveLawTab] = useState<"geometry" | "multiplication">("geometry");
  const isLaws = tool === "laws";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-study-tools-title"
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              {isLaws ? <BookOpen className="h-5 w-5" aria-hidden="true" /> : <Calculator className="h-5 w-5" aria-hidden="true" />}
            </span>
            <div>
              <h2 id="exam-study-tools-title" className="text-lg font-extrabold text-slate-900">
                {isLaws ? "القوانين" : "الحاسبة العلمية"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isLaws ? "مرجع سريع لقوانين الهندسة وخواص الضرب." : "جمع وطرح وضرب وقسمة وأسُس وجذور."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {isLaws ? (
          <>
            <div className="flex gap-2 border-b border-slate-100 px-4 pt-3 sm:px-6" role="tablist" aria-label="أقسام القوانين">
              <button
                type="button"
                role="tab"
                aria-selected={activeLawTab === "geometry"}
                onClick={() => setActiveLawTab("geometry")}
                className={`rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                  activeLawTab === "geometry"
                    ? "border-sky-600 text-sky-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                الهندسة
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeLawTab === "multiplication"}
                onClick={() => setActiveLawTab("multiplication")}
                className={`rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                  activeLawTab === "multiplication"
                    ? "border-sky-600 text-sky-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                خواص الضرب
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {activeLawTab === "geometry" ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {geometryFormulas.map((group) => (
                      <article key={group.title} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                        <h3 className="mb-2 text-sm font-extrabold text-slate-800">{group.title}</h3>
                        <ul className="space-y-1.5">
                          {group.formulas.map((formula) => (
                            <li key={formula} className="text-sm leading-6 text-slate-600">{formula}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                  <details className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      المرجع الهندسي المصوّر الكامل
                    </summary>
                    <div className="border-t border-slate-100 bg-white p-2 sm:p-4">
                      <img
                        src={formulasImg}
                        alt="ورقة مرجعية لقوانين الهندسة والرياضيات الأساسية"
                        className="mx-auto max-h-[56dvh] w-full rounded-lg object-contain"
                      />
                    </div>
                  </details>
                </>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {multiplicationLaws.map((law) => (
                    <article key={law.title} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                      <h3 className="text-sm font-extrabold text-slate-800">{law.title}</h3>
                      <p className="mt-3 rounded-lg bg-white px-3 py-2 text-center text-lg font-bold text-sky-800" dir="ltr">
                        {law.formula}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{law.example}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-sm">
              <ScientificCalculator />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
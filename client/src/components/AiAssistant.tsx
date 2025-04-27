import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  BrainCircuitIcon, 
  Loader2, 
  MessageSquare, 
  SendIcon,
  RefreshCcw,
  BadgeHelp,
  BookOpenCheck,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TestQuestion } from "@shared/types";
import { cn } from "@/lib/utils";
import { smartSearch, findRelatedQuestions } from "@/lib/smartSearch";

interface AiAssistantProps {
  questions: TestQuestion[];
  userLevel?: number;
  onQuestionSelect?: (question: TestQuestion) => void;
  className?: string;
}

type MessageType = {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  relatedQuestions?: TestQuestion[];
};

// Predefined responses for common questions
const PREDEFINED_RESPONSES: Record<string, string> = {
  // أساسيات عامة واستقبال
  "مرحبا": "مرحباً بك يا يوسف! كيف يمكنني مساعدتك اليوم؟",
  "السلام عليكم": "وعليكم السلام ورحمة الله وبركاته! أهلاً بك في منصة قدراتك. كيف يمكنني مساعدتك اليوم؟",
  "كيف حالك": "أنا بخير، شكراً للسؤال! كيف يمكنني مساعدتك؟",
  
  // معلومات عن التطبيق
  "ما هو هذا التطبيق": "هذا هو تطبيق قدراتك - منصة تعليمية تساعدك على التحضير لاختبارات القدرات العامة من خلال أكثر من 10,000 سؤال وتمارين تفاعلية ونصائح مخصصة.",
  "كيف استخدم التطبيق": "يمكنك استخدام التطبيق للبحث عن أسئلة، وممارسة اختبارات القدرات التفاعلية، والتحضير لاختبار قياس الرسمي. استكشف الأقسام المختلفة من القائمة الجانبية: المكتبة، اختبر قدراتك، اختبار قياس، إنشاء اختبار مخصص، والتحديات.",

  // معلومات عن اختبار قياس
  "ما هو اختبار قياس": "اختبار قياس (الاختبار العام) هو اختبار وطني تقدمه هيئة تقويم التعليم والتدريب في المملكة العربية السعودية، ويقيس القدرات التحليلية والاستدلالية لدى الطلاب في مجالي اللغة والرياضيات. يتكون من 7 أقسام بإجمالي 120 سؤال في 120 دقيقة.",
  "كيف اذاكر لاختبار القدرات": "لتحضير فعال لاختبار القدرات، أنصحك بالآتي: 1) حل الكثير من الأسئلة التدريبية 2) التركيز على فهم المفاهيم بدلاً من الحفظ 3) تعلم استراتيجيات حل الأسئلة 4) إدارة وقتك بشكل صحيح 5) استخدم قسم 'اختبر قدراتك' في تطبيقنا للممارسة المنتظمة.",
  "ما هي أقسام الاختبار": "ينقسم اختبار قياس الرسمي إلى 7 أقسام: القسم 1-3: كل قسم يتكون من 24 سؤال (13 لفظي + 11 كمي) في 24 دقيقة، القسم 4: 11 سؤال كمي في 11 دقيقة، القسم 5: 13 سؤال لفظي في 13 دقيقة، القسم 6: 11 سؤال كمي في 11 دقيقة، القسم 7: 13 سؤال لفظي في 13 دقيقة.",
  "كم مدة الاختبار": "مدة اختبار قياس الرسمي هي 120 دقيقة (ساعتان) موزعة على سبعة أقسام. ويحتوي على 120 سؤالاً بالمجمل.",

  // معلومات عن نظام المنصة
  "ما هي فائدة النقاط": "تمثل النقاط مستوى تقدمك في المنصة. كلما حصلت على نقاط أكثر، كلما ارتفع مستواك وفتحت مستويات أصعب من الأسئلة. يمكنك الحصول على النقاط من خلال الإجابة بشكل صحيح على الأسئلة في قسم 'اختبر قدراتك' وفي اختبارات قياس التجريبية.",
  "كيف انشئ اختبار مخصص": "يمكنك إنشاء اختبار مخصص من خلال الذهاب إلى قسم 'اختبارات مخصصة' في القائمة الجانبية، ثم اختيار عدد الأسئلة والمدة الزمنية ونوع الأسئلة (لفظي أو كمي) ومستوى الصعوبة الذي تريده.",
  "ما هي اللهجات المدعومة": "تدعم منصة قدراتك اللهجات التالية: الفصحى (المعيارية)، اللهجة السعودية، اللهجة المصرية، اللهجة الخليجية، وغيرها. يمكنك البحث عن الأسئلة حسب اللهجة في قسم المكتبة.",
  
  // القدرات التحليلية
  "قارن بين الاختبارات": "هناك عدة أنواع من الاختبارات في منصة قدراتك:\n1. اختبار قياس: محاكاة للاختبار الرسمي بـ 120 سؤال في 120 دقيقة موزعة على 7 أقسام.\n2. اختبر قدراتك: اختبارات قصيرة تتدرج من المستوى المبتدئ إلى المتقدم.\n3. التحديات: اختبارات صعبة تفتح تدريجياً حسب تقدمك ونقاطك.\n4. اختبارات مخصصة: يمكنك إنشاؤها حسب احتياجاتك من حيث المحتوى والمدة.\nالفرق الرئيسي هو أن قياس هو محاكاة للاختبار الرسمي بينما البقية أدوات تدريب مرنة.",
  
  // إبداع واقتراح
  "اقترح لي طريقة مذاكرة": "إليك خطة مذاكرة منظمة لاختبار القدرات:\n1. المرحلة الأولى (4 أسابيع قبل الاختبار): تعلم المفاهيم الأساسية واستراتيجيات الحل، مع تخصيص ساعة يومياً.\n2. المرحلة الثانية (أسبوعان): حل اختبارات قصيرة على كل مهارة، مع تحليل الأخطاء وساعتين يومياً.\n3. المرحلة الثالثة (الأسبوع الأخير): اختبارات كاملة محاكية لقياس في ظروف مشابهة، مع التدرب على إدارة الوقت.\n4. يوم الاختبار: احصل على قسط كافٍ من النوم، تناول وجبة خفيفة، وصل مبكراً لمركز الاختبار.\nالنصيحة الذهبية: استخدم قسم 'اختبر قدراتك' للتدرب المنظم حسب المستويات، ثم التحديات.",
  
  // المعرفة العامة
  "ما هي أهم مهارات القدرات اللفظية": "أهم مهارات القدرات اللفظية التي يجب إتقانها:\n1. إكمال الجمل: اختيار الكلمة المناسبة نحوياً ودلالياً.\n2. المترادفات والمتضادات: فهم العلاقات بين الكلمات.\n3. قياس المنطق اللفظي: إيجاد العلاقة المنطقية بين مجموعات الكلمات.\n4. القراءة والاستيعاب: فهم النصوص واستخراج المعلومات.\n5. التناظر اللفظي: فهم العلاقات بين أزواج الكلمات.\n6. التصنيف المنطقي: تحديد عناصر تنتمي لمجموعة معينة.\nركز على بناء رصيدك اللغوي وتطوير مهارات التفكير المنطقي.",
  
  "ما هي أهم مهارات القدرات الكمية": "أهم مهارات القدرات الكمية المطلوبة:\n1. الحساب الأساسي: العمليات الحسابية والكسور والنسب المئوية.\n2. الجبر: حل المعادلات البسيطة والمتوسطة.\n3. الهندسة: حساب مساحة ومحيط الأشكال الأساسية.\n4. الاحتمالات والإحصاء: فهم مبادئ الاحتمالات والمتوسطات.\n5. التفكير المنطقي الرياضي: حل المسائل الكلامية وتحويلها لمعادلات.\n6. تفسير البيانات: قراءة الرسوم البيانية والجداول.\nركز على فهم المفاهيم وتطبيقها في سياقات مختلفة بدلاً من الحفظ.",
  
  // التخصصات الدقيقة
  "اشرح الفرق بين اللهجات العربية": "اللهجات العربية المدعومة في منصتنا تتميز بفروق لغوية وصوتية مهمة:\n1. الفصحى: اللغة المعيارية المستخدمة في الكتابة والإعلام، وتتميز بضبط أواخر الكلمات (الإعراب).\n2. اللهجة السعودية: تتميز بنطق القاف كما هي، واستخدام مفردات خاصة مثل (مرة) بمعنى جداً، و(عشان) بمعنى لأجل.\n3. اللهجة المصرية: تحول الجيم إلى 'گ' في بعض الكلمات، وتستخدم مفردات مثل (أوي) بمعنى جداً، و(عايز) بمعنى أريد.\n4. اللهجة الخليجية: تشترك مع السعودية في بعض السمات مع وجود مفردات خاصة مثل (شنو) بمعنى ماذا، و(يبا) للمناداة.\nفهم هذه الفروق يساعدك في التعامل مع أسئلة القدرات اللفظية المتنوعة.",

  "ما الفرق بين السكري النوع الأول والنوع الثاني": "الفرق بين النوع الأول والنوع الثاني من مرض السكري:\n\nالنوع الأول:\n• سببه: مناعي ذاتي (الجهاز المناعي يهاجم خلايا بيتا في البنكرياس)\n• يظهر غالباً: في سن مبكرة (الطفولة والمراهقة)\n• إنتاج الأنسولين: منعدم أو قليل جداً\n• العلاج: يحتاج حقن أنسولين بشكل دائم\n• الوزن: المرضى غالباً نحيفون\n\nالنوع الثاني:\n• سببه: مقاومة الخلايا للأنسولين\n• يظهر غالباً: في سن متأخرة (بعد 40 سنة)\n• إنتاج الأنسولين: موجود لكن الجسم لا يستجيب له بشكل كافٍ\n• العلاج: يمكن التحكم بالنظام الغذائي والحبوب وأحياناً الأنسولين\n• الوزن: المرضى غالباً يعانون من زيادة الوزن أو السمنة",
  
  // التعامل مع أوامر تنفيذية
  "احسب مساحة المثلث": "لحساب مساحة المثلث، نستخدم القانون: المساحة = (القاعدة × الارتفاع) ÷ 2\n\nمثال: مثلث قاعدته 6 سم وارتفاعه 8 سم\nالمساحة = (6 × 8) ÷ 2 = 48 ÷ 2 = 24 سم²\n\nيمكنك أيضاً استخدام قانون هيرون إذا كنت تعرف أطوال الأضلاع الثلاثة:\nالمساحة = √[نق × (نق-أ) × (نق-ب) × (نق-جـ)]\nحيث نق = نصف محيط المثلث = (أ + ب + جـ) ÷ 2",
  
  "لخص مبادئ التفكير النقدي": "مبادئ التفكير النقدي في خمس نقاط أساسية:\n1. الشك المنهجي: لا تقبل المعلومات دون تمحيص ودليل.\n2. تحليل الافتراضات: اكتشاف المسلمات غير المصرح بها وراء الأفكار.\n3. تقييم الأدلة: فحص قوة الأدلة ومصداقيتها ومدى ارتباطها بالادعاء.\n4. النظر من زوايا متعددة: استكشاف وجهات نظر مختلفة قبل الحكم.\n5. الاستنتاج المنطقي: بناء استنتاجات تستند إلى أدلة وتحليل منطقي سليم.\n\nتطبيق هذه المبادئ يساعدك في التعامل مع أسئلة القدرات اللفظية والكمية التي تتطلب تفكيراً منطقياً.",
  
  // الذكاء العاطفي واللباقة
  "أنا متوتر من الاختبار": "من الطبيعي تماماً أن تشعر بالتوتر قبل اختبار مهم مثل قياس. هذا يدل على اهتمامك بالأمر! إليك بعض النصائح للتعامل مع هذا التوتر:\n\n1. خذ نفساً عميقاً ببطء عندما تشعر بالتوتر يزداد.\n2. تذكر أنك قد تدربت وأنك مستعد.\n3. ركز على الأسئلة واحداً تلو الآخر، ولا تفكر بالاختبار ككل.\n4. استخدم منصة قدراتك للتدرب على محاكاة ظروف الاختبار للتعود عليها.\n5. فكر في النجاح وليس في الخوف من الفشل.\n\nأنت قادر على اجتياز هذا الاختبار، وتذكر أن بإمكانك دائماً المحاولة مرة أخرى إذا لم تحقق ما تريد هذه المرة.",
  
  "شعرت بالإحباط": "أفهم شعورك بالإحباط تماماً، فمسار التعلم والتحضير للاختبار ليس سهلاً دائماً. ولكن تذكر أن الصعوبات هي جزء طبيعي من رحلة النجاح، وكل شخص ناجح واجه العقبات والإحباط.\n\nنصائح للتغلب على الإحباط:\n1. خذ استراحة قصيرة وابتعد عن الدراسة لبضع ساعات.\n2. قسم المهام الكبيرة إلى خطوات صغيرة يمكن تحقيقها.\n3. احتفل بالإنجازات الصغيرة على طول الطريق.\n4. تواصل مع زملائك الذين يمرون بنفس التجربة.\n5. ركز على تقدمك الشخصي وليس على مقارنة نفسك بالآخرين.\n\nأنت تتقدم خطوة بخطوة، واستمرارك رغم الإحباط هو دليل على قوتك وعزيمتك.",
  
  // أمثلة على أسئلة الاختبار
  "اقترح 3 أفكار تسويقية": "إليك 3 أفكار تسويقية مبتكرة يمكن تطبيقها لمشروع ناشئ:\n\n1. التسويق بالمحتوى التفاعلي: إنشاء محتوى تعليمي مفيد مرتبط بمجالك (مدونات، فيديوهات قصيرة، انفوجرافيك) مع تضمينه اختبارات قصيرة أو استطلاعات تفاعلية تزيد من مشاركة الجمهور.\n\n2. برنامج السفراء الرقميين: استقطاب مجموعة مخلصة من العملاء الراضين كسفراء للعلامة التجارية، ومنحهم مزايا خاصة مقابل مشاركتهم تجاربهم الإيجابية عبر منصات التواصل الاجتماعي.\n\n3. تسويق المناسبات المصغّرة: تنظيم فعاليات افتراضية صغيرة ومتخصصة (ورش عمل، جلسات حوارية) تستهدف شرائح محددة من جمهورك المستهدف، مما يخلق تجربة شخصية وحصرية ويبني علاقات أعمق مع العملاء المحتملين.",
  
  "اكتب كود بايثون لحساب المتوسط": "إليك كود بلغة Python لحساب متوسط مجموعة أرقام:\n\n```python\ndef calculate_average(numbers):\n    # التحقق من أن القائمة ليست فارغة\n    if not numbers:\n        return 0\n    \n    # حساب مجموع القيم\n    total = sum(numbers)\n    \n    # حساب عدد القيم\n    count = len(numbers)\n    \n    # حساب المتوسط وإرجاعه\n    return total / count\n\n# مثال للاستخدام\nnumbers_list = [10, 20, 30, 40, 50]\nresult = calculate_average(numbers_list)\nprint(f\"المتوسط هو: {result}\")\n```\n\nهذا الكود يقوم بإنشاء دالة تأخذ قائمة أرقام وتعيد متوسطها الحسابي، مع التحقق من أن القائمة ليست فارغة لتجنب الأخطاء.",
  
  "ترجم هذه الفقرة للإنجليزية": "سأساعدك في ترجمة فقرة من العربية إلى الإنجليزية. يرجى كتابة الفقرة المراد ترجمتها، وسأقوم بترجمتها بشكل دقيق مع مراعاة السياق والمصطلحات المناسبة."
};

// Create regex patterns from the predefined responses
const RESPONSE_PATTERNS = Object.keys(PREDEFINED_RESPONSES).map(key => {
  const pattern = key
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special characters
    .replace(/\s+/g, '\\s+');  // Make whitespace flexible
  return { pattern: new RegExp(`^\\s*${pattern}\\s*$`, 'i'), response: PREDEFINED_RESPONSES[key] };
});

const AiAssistant: React.FC<AiAssistantProps> = ({ 
  questions, 
  userLevel = 1,
  onQuestionSelect,
  className 
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    const welcomeMessage: MessageType = {
      id: "welcome",
      text: "مرحبًا بك في مساعد قدراتي! أنا هنا لمساعدتك في العثور على أسئلة مشابهة والإجابة على استفساراتك. كيف يمكنني مساعدتك اليوم؟",
      sender: "assistant",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Check for predefined responses
      let response = checkPredefinedResponses(input);

      // No predefined response, try to search for related questions
      if (!response) {
        // Search for similar questions
        const searchResults = smartSearch(input, questions, { threshold: 0.35, maxResults: 5 });

        if (searchResults.length > 0) {
          const relatedQuestionsText = searchResults.map((result, index) => 
            `${index + 1}. ${result.question.text}`
          ).join('\n');

          response = `وجدت بعض الأسئلة التي قد تكون مفيدة:\n\n${relatedQuestionsText}\n\nهل ترغب في مزيد من المعلومات حول أي من هذه الأسئلة؟`;

          // Add related questions to the message
          const relatedQuestions = searchResults.map(result => result.question);
          
          const assistantMessage: MessageType = {
            id: Date.now().toString(),
            text: response,
            sender: "assistant",
            timestamp: new Date(),
            relatedQuestions
          };

          setMessages(prev => [...prev, assistantMessage]);
          setIsProcessing(false);
          return;
        }

        // If no related questions found, give a generic response
        response = generateGenericResponse(input);
      }

      // Send assistant response
      const assistantMessage: MessageType = {
        id: Date.now().toString(),
        text: response,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in AI response:', error);
      
      // Error message
      const errorMessage: MessageType = {
        id: Date.now().toString(),
        text: "عذرًا، حدث خطأ ما. يرجى المحاولة مرة أخرى.",
        sender: "assistant",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for predefined responses
  const checkPredefinedResponses = (userInput: string): string | null => {
    for (const { pattern, response } of RESPONSE_PATTERNS) {
      if (pattern.test(userInput)) {
        return response;
      }
    }
    return null;
  };

  // Generate a generic response for inputs without matches
  const generateGenericResponse = (userInput: string): string => {
    // Detect if this might be a greeting
    if (/^(سلام|اهلا|هاي|هلا|مرحب|صباح|مساء)/i.test(userInput)) {
      return "أهلاً بك يا يوسف! كيف يمكنني مساعدتك اليوم؟";
    }
    
    // Check for requests about questions directly
    if (/سؤال عن|أسألك عن|اسألني|فسر لي|اشرح|الإجابة|الحل/.test(userInput)) {
      return "يسعدني مساعدتك! اكتب السؤال الذي تريد إجابته أو شرحه بشكل واضح، وسأحاول تقديم الشرح المناسب. يمكنك أيضًا البحث في المكتبة للحصول على أسئلة مشابهة.";
    }
    
    // Detect requests about exams
    if (/اختبار|امتحان|قياس|اخت[بت]ر|تجريبي/.test(userInput)) {
      return "منصة قدراتك تقدم عدة أنواع من الاختبارات: \n1. اختبر قدراتك (من المستوى المبتدئ إلى المتقدم)\n2. اختبار قياس الرسمي بنفس هيكلية اختبار هيئة تقويم التعليم\n3. اختبارات مخصصة يمكنك تصميمها بنفسك\nأي نوع تفضل تجربته؟";
    }
    
    // Detect question patterns with more context 
    if (/كيف|ماذا|لماذا|متى|أين|من|هل/.test(userInput)) {
      if (/نقاط|مستوى|تقدم|ترتيب/.test(userInput)) {
        return "نظام النقاط في منصة قدراتك يعتمد على أدائك في الاختبارات. كلما أجبت على أسئلة أكثر بشكل صحيح، تحصل على نقاط أكثر وترتفع في المستويات. وكلما ارتفع مستواك، تُفتح لك مستويات أصعب من الأسئلة للتحدي.";
      }
      if (/مستويات|صعوبة|سهولة/.test(userInput)) {
        return "تتدرج مستويات الصعوبة في منصة قدراتك من المبتدئ، إلى المتوسط، ثم المتقدم، وصولاً إلى الخبير. عند بداية استخدامك للمنصة، تبدأ بالمستوى المبتدئ، وكلما حققت نتائج جيدة، تنتقل إلى المستويات الأعلى تلقائياً.";
      }
      if (/لهجة|لهجات|فصحى|سعودي|مصري/.test(userInput)) {
        return "تدعم منصة قدراتك عدة لهجات منها الفصحى واللهجة السعودية والمصرية والخليجية. يمكنك اختيار اللهجة المفضلة عند البحث في المكتبة باستخدام خيارات التصفية.";
      }
      if (/مساعد|ذكاء|ذكي|ai|chat/.test(userInput)) {
        return "أنا المساعد الذكي لمنصة قدراتك، مصمم لمساعدتك في البحث عن الأسئلة وشرحها وتقديم نصائح للدراسة. أستخدم تقنيات البحث الذكي المحلية وقاعدة بيانات الأسئلة في المنصة للإجابة على استفساراتك دون الحاجة للاتصال بخدمات ذكاء اصطناعي خارجية.";
      }
      
      return "شكرًا على سؤالك. يمكنني مساعدتك بمعلومات عن منصة قدراتك واختبارات القدرات وقياس وكذلك شرح الأسئلة وطرق الإجابة عليها. حاول طرح سؤالك بطريقة أكثر تحديداً للحصول على إجابة أفضل.";
    }

    // Detect if input seems like a math problem
    if (/\d+|\+|\-|\*|\/|=/.test(userInput)) {
      return "يبدو أنك تسأل عن مسألة رياضية. يمكنك تجربة قسم القدرات الكمية للتدرب على مسائل مشابهة. يمكنني أيضاً شرح طرق حل المسائل الرياضية إذا كتبت المسألة بشكل واضح.";
    }

    // Default fallback
    return "شكرًا لرسالتك يا يوسف. أنا مساعد منصة قدراتك، وأستطيع مساعدتك في العثور على الأسئلة وشرحها، وتقديم معلومات عن اختبارات القدرات وقياس. يمكنك طرح أي سؤال أو استعلام وسأحاول مساعدتك بأفضل ما يمكن.";
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleSend();
    }
  };

  // Handle selecting a related question
  const handleQuestionClick = (question: TestQuestion) => {
    if (onQuestionSelect) {
      onQuestionSelect(question);
      toast({
        title: "تم اختيار السؤال",
        description: "تم فتح السؤال في المكتبة",
      });
    } else {
      // Show the question details in the chat
      const details = `
السؤال: ${question.text}

الخيارات:
${question.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}

الإجابة الصحيحة: ${question.options[question.correctOptionIndex]}

${question.explanation ? `الشرح: ${question.explanation}` : ''}
      `;

      const detailsMessage: MessageType = {
        id: Date.now().toString(),
        text: details,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, detailsMessage]);
    }
  };

  // Copy message text to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "فشل في النسخ",
          description: "حدث خطأ أثناء محاولة نسخ النص",
          variant: "destructive",
        });
      });
  };

  // Clear all messages
  const clearMessages = () => {
    const welcomeMessage: MessageType = {
      id: "welcome",
      text: "تم مسح المحادثة. كيف يمكنني مساعدتك اليوم؟",
      sender: "assistant",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className={cn("flex flex-col h-full rounded-lg border bg-card shadow", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <BrainCircuitIcon className="h-5 w-5 text-primary" />
          <h3 className="font-medium">مساعد قدراتي</h3>
        </div>
        <div>
          <Button variant="ghost" size="icon" onClick={clearMessages} title="مسح المحادثة">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col max-w-[85%] rounded-lg p-3 relative group",
              message.sender === "user"
                ? "bg-primary text-primary-foreground mr-auto"
                : "bg-muted ml-auto"
            )}
          >
            <div className="whitespace-pre-wrap text-sm">{message.text}</div>
            
            {/* Related questions */}
            {message.relatedQuestions && message.relatedQuestions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <Separator />
                <div className="text-xs font-medium flex items-center gap-1 mt-1">
                  <BadgeHelp className="h-3 w-3" />
                  <span>اضغط على سؤال لعرض التفاصيل:</span>
                </div>
                <div className="space-y-1.5">
                  {message.relatedQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      onClick={() => handleQuestionClick(question)}
                      className={cn(
                        "text-xs p-2 rounded cursor-pointer flex items-start gap-1.5",
                        message.sender === "user"
                          ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                          : "bg-background hover:bg-accent"
                      )}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <BookOpenCheck className="h-3 w-3" />
                      </div>
                      <div>{question.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Message actions */}
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(message.text, message.id)}
              >
                {copied === message.id ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            
            {/* Timestamp */}
            <div className="text-xs opacity-50 mt-1 text-right">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-center">
            <div className="bg-muted px-4 py-2 rounded-lg flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              <span className="text-sm">جاري التفكير...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            placeholder="اكتب سؤالك هنا..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={isProcessing || !input.trim()}
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground text-center">
          مساعد محلي يستخدم نظام البحث الذكي - لا تتم مشاركة البيانات
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
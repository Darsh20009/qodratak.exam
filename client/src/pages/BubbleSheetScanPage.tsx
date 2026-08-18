import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Camera, Upload, CheckCircle, XCircle, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  questionNumber: number;
  selectedAnswer: number | null; // 0=أ, 1=ب, 2=ج, 3=د, 4=هـ
  confidence: number; // 0-100
}

// تحويل من رقم إلى حرف عربي
const getArabicLetter = (index: number): string => {
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ'];
  return letters[index] || '—';
};

export default function BubbleSheetScanPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get exam data from localStorage
  const examData = localStorage.getItem('paperExamData');
  const exam = examData ? JSON.parse(examData) : null;

  useEffect(() => {
    if (!exam) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على بيانات الاختبار",
        variant: "destructive",
      });
      setLocation("/paper-models");
    }

    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
  }, [exam, setLocation, toast]);

  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      console.log('✅ Camera stream obtained:', stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('✅ Video ref exists, setting srcObject');
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded');
          videoRef.current?.play()
            .then(() => console.log('✅ Video playing'))
            .catch(err => console.error('❌ Video play error:', err));
        };
        
        setCameraActive(true);
        toast({
          title: "تم تشغيل الكاميرا",
          description: "ضع البابل شيت داخل الإطار الأخضر",
        });
      } else {
        console.error('❌ Video ref is null');
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      toast({
        title: "خطأ في الكاميرا",
        description: "تعذر الوصول إلى الكاميرا. تأكد من منح الإذن.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');
    
    const newImages = [...capturedImages, imageData];
    setCapturedImages(newImages);
    
    if (newImages.length < 3) {
      setCurrentPage(newImages.length + 1);
      toast({
        title: `تم التقاط الصفحة ${newImages.length}`,
        description: newImages.length < 3 
          ? `التقط الصفحة ${newImages.length + 1} من البابل شيت` 
          : "تم التقاط جميع الصفحات",
      });
    } else {
      stopCamera();
      processAllImages(newImages);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 3) {
      toast({
        title: "خطأ",
        description: "يمكنك رفع 3 صور كحد أقصى (صفحات البابل شيت الثلاثة)",
        variant: "destructive",
      });
      return;
    }

    const imageDataUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      imageDataUrls.push(dataUrl);
    }
    
    setCapturedImages(imageDataUrls);
    processAllImages(imageDataUrls);
  };

  const processAllImages = async (imageDataUrls: string[]) => {
    setProcessing(true);
    setProgress(0);

    const allResults: ScanResult[] = [];

    for (let pageIndex = 0; pageIndex < imageDataUrls.length; pageIndex++) {
      const imgDataUrl = imageDataUrls[pageIndex];
      const img = new Image();
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imgDataUrl;
      });

      if (!canvasRef.current) continue;
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);

      const pageResults = await processOnePage(canvas, pageIndex);
      allResults.push(...pageResults);
      
      setProgress(((pageIndex + 1) / imageDataUrls.length) * 100);
    }

    setScanResults(allResults);
    setProcessing(false);

    const detectedCount = allResults.filter(r => r.selectedAnswer !== null).length;
    toast({
      title: "تم المسح بنجاح",
      description: `تم اكتشاف ${detectedCount} إجابة من ${allResults.length} سؤال`,
    });
  };

  /**
   * خوارزمية محسّنة لمعالجة صفحة واحدة من البابل شيت
   * - معالجة مسبقة قوية للصورة
   * - كشف تكيفي للدوائر المظللة
   * - تحسين الدقة والثقة
   */
  const processOnePage = async (canvas: HTMLCanvasElement, pageIndex: number): Promise<ScanResult[]> => {
    const context = canvas.getContext('2d');
    if (!context) return [];

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // معالجة مسبقة محسّنة
    const processed = enhancedPreprocessing(imageData, canvas.width, canvas.height);

    const questionsPerPage = 40;
    const optionsPerQuestion = 5;
    
    // هوامش محسّنة - نبدأ من 15% بدلاً من 10%
    const marginTop = 0.15;
    const marginBottom = 0.05;
    const marginSide = 0.12;
    
    const effectiveWidth = canvas.width * (1 - 2 * marginSide);
    const effectiveHeight = canvas.height * (1 - marginTop - marginBottom);
    const startX = canvas.width * marginSide;
    const startY = canvas.height * marginTop;
    
    const questionHeight = effectiveHeight / questionsPerPage;
    const optionWidth = effectiveWidth / optionsPerQuestion;

    const results: ScanResult[] = [];

    for (let q = 0; q < questionsPerPage; q++) {
      const questionY = startY + (q * questionHeight);
      let selectedAnswer: number | null = null;
      let maxDarkness = 0;
      const darknessValues: number[] = [];

      // فحص كل خيار
      for (let opt = 0; opt < optionsPerQuestion; opt++) {
        const optionX = startX + (opt * optionWidth);
        
        const centerX = Math.floor(optionX + optionWidth / 2);
        const centerY = Math.floor(questionY + questionHeight / 2);
        
        // نصف قطر أصغر قليلاً لتجنب الحواف
        const radius = Math.min(optionWidth, questionHeight) * 0.35;

        // حساب الظلام مع تجاهل الحواف
        const darkness = calculateBubbleDarkness(
          processed, 
          canvas.width, 
          canvas.height, 
          centerX, 
          centerY, 
          radius
        );

        darknessValues.push(darkness);
        
        if (darkness > maxDarkness) {
          maxDarkness = darkness;
          selectedAnswer = opt;
        }
      }

      // عتبة تكيفية ذكية
      // إذا كانت الفروقات بين الإجابات واضحة، نثق بالنتيجة
      const sortedDarkness = [...darknessValues].sort((a, b) => b - a);
      const diff = sortedDarkness[0] - sortedDarkness[1]; // الفرق بين الأعلى والثاني
      
      // نحتاج فرق واضح (على الأقل 20) وظلام كافٍ (على الأقل 60)
      const isConfident = maxDarkness > 60 && diff > 20;
      
      // حساب الثقة بناءً على الظلام والفرق
      const confidence = Math.min(
        Math.round((maxDarkness / 150) * 100 * (diff / 50)), 
        100
      );

      const actualQuestionNumber = (pageIndex * questionsPerPage) + q + 1;

      results.push({
        questionNumber: actualQuestionNumber,
        selectedAnswer: isConfident ? selectedAnswer : null,
        confidence: isConfident ? Math.max(confidence, 50) : 0
      });

      // تحديث التقدم
      const pageProgress = ((q + 1) / questionsPerPage) * 100;
      setProgress(((pageIndex + pageProgress / 100) / 3) * 100);

      await new Promise(resolve => setTimeout(resolve, 3));
    }

    return results;
  };

  /**
   * معالجة مسبقة محسّنة للصورة
   * - تحويل لـ grayscale
   * - تطبيع السطوع والتباين
   * - تقليل الضوضاء
   */
  const enhancedPreprocessing = (
    imageData: ImageData, 
    width: number, 
    height: number
  ): number[] => {
    const data = imageData.data;
    const grayscale = new Array(width * height);
    
    // المرحلة 1: تحويل لـ grayscale
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      grayscale[i / 4] = gray;
    }
    
    // المرحلة 2: حساب الإحصائيات للتطبيع
    let sum = 0;
    let min = 255;
    let max = 0;
    
    for (let i = 0; i < grayscale.length; i++) {
      sum += grayscale[i];
      if (grayscale[i] < min) min = grayscale[i];
      if (grayscale[i] > max) max = grayscale[i];
    }
    
    const mean = sum / grayscale.length;
    const range = max - min;
    
    // المرحلة 3: تطبيع وحساب الظلام
    const darkness = new Array(width * height);
    for (let i = 0; i < grayscale.length; i++) {
      // تطبيع القيمة
      const normalized = range > 0 ? ((grayscale[i] - min) / range) * 255 : grayscale[i];
      
      // الظلام = 255 - السطوع المطبّع
      darkness[i] = 255 - normalized;
      
      // تعزيز التباين للقيم الداكنة
      if (darkness[i] > 100) {
        darkness[i] = Math.min(darkness[i] * 1.2, 255);
      }
    }
    
    return darkness;
  };

  /**
   * حساب متوسط الظلام داخل دائرة مع تجاهل الحواف
   */
  const calculateBubbleDarkness = (
    darkness: number[],
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    radius: number
  ): number => {
    let totalDarkness = 0;
    let pixelCount = 0;
    
    // فحص فقط 80% من نصف القطر لتجاهل حواف الدائرة
    const effectiveRadius = radius * 0.8;

    for (let dy = -effectiveRadius; dy <= effectiveRadius; dy++) {
      for (let dx = -effectiveRadius; dx <= effectiveRadius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= effectiveRadius) {
          const x = Math.floor(centerX + dx);
          const y = Math.floor(centerY + dy);

          if (x >= 0 && x < width && y >= 0 && y < height) {
            const index = y * width + x;
            totalDarkness += darkness[index];
            pixelCount++;
          }
        }
      }
    }

    return pixelCount > 0 ? totalDarkness / pixelCount : 0;
  };

  const retake = () => {
    setCapturedImages([]);
    setScanResults([]);
    setProgress(0);
    setCurrentPage(1);
  };

  const submitAnswers = () => {
    if (!exam) return;

    const answers: { [key: number]: number } = {};
    scanResults.forEach(result => {
      if (result.selectedAnswer !== null) {
        answers[result.questionNumber - 1] = result.selectedAnswer;
      }
    });

    localStorage.setItem('scannedAnswers', JSON.stringify(answers));

    toast({
      title: "تم الحفظ",
      description: "جاري الانتقال لصفحة النتائج...",
    });

    setTimeout(() => {
      setLocation("/paper-exam-results");
    }, 1000);
  };

  if (!exam) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            التصحيح التلقائي بالكاميرا
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {exam.name}
          </p>
        </div>

        {/* Instructions */}
        {capturedImages.length === 0 && (
          <>
            <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription>
                <strong className="text-yellow-900 dark:text-yellow-100 text-lg">⚠️ نظام تجريبي</strong>
                <p className="mt-2 text-yellow-800 dark:text-yellow-200">
                  هذا النظام في مرحلة تجريبية. يرجى مراجعة النتائج المستخرجة بعناية قبل التأكيد.
                  للحصول على أفضل النتائج، اتبع التعليمات بدقة.
                </p>
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertDescription>
                <strong className="text-blue-900 dark:text-blue-100">تعليمات مهمة للحصول على أفضل نتيجة:</strong>
                <ul className="list-disc list-inside mt-3 space-y-2 text-blue-800 dark:text-blue-200">
                  <li><strong>إضاءة جيدة:</strong> تأكد من إضاءة قوية ومتساوية على البابل شيت بالكامل</li>
                  <li><strong>مستقيم تماماً:</strong> ضع البابل شيت بشكل مستقيم داخل الإطار الأخضر</li>
                  <li><strong>بدون ظلال:</strong> تجنب الظلال والانعكاسات على الورقة</li>
                  <li><strong>قلم غامق:</strong> استخدم قلم HB2 للتظليل الواضح والكامل</li>
                  <li><strong>زاوية قائمة:</strong> صوّر من الأعلى مباشرة بدون إمالة</li>
                  <li><strong>تركيز جيد:</strong> تأكد من وضوح الصورة قبل الالتقاط</li>
                </ul>
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Camera/Upload Section */}
        {capturedImages.length === 0 && (
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-600 dark:from-blue-950 dark:to-emerald-600">
              <CardTitle className="text-xl">
                {cameraActive ? `صفحة ${currentPage} من 3` : 'اختر طريقة الإدخال'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!cameraActive ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={startCamera}
                    className="w-full h-24 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    data-testid="button-start-camera"
                  >
                    <Camera className="w-7 h-7 ml-3" />
                    <div>
                      <div>تشغيل الكاميرا</div>
                      <div className="text-sm opacity-90">التصوير المباشر</div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-24 text-lg border-2"
                    data-testid="button-upload-image"
                  >
                    <Upload className="w-7 h-7 ml-3" />
                    <div>
                      <div>رفع الصور</div>
                      <div className="text-sm opacity-70">1-3 صور من المعرض</div>
                    </div>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Camera Preview with Enhanced Guide Frame */}
                  <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl" style={{ minHeight: '500px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full"
                      style={{
                        display: 'block',
                        width: '100%',
                        minHeight: '500px',
                        maxHeight: '70vh',
                        objectFit: 'cover',
                        backgroundColor: '#000'
                      }}
                      data-testid="video-camera"
                    />
                    {/* Guide Frame Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* الإطار الخارجي */}
                      <div className="absolute inset-4 border-4 border-green-500 border-dashed rounded-lg animate-pulse">
                        {/* الزوايا */}
                        <div className="absolute -top-1 -left-1 w-12 h-12 border-t-8 border-l-8 border-green-400 rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-12 h-12 border-t-8 border-r-8 border-green-400 rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-8 border-l-8 border-green-400 rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-8 border-r-8 border-green-400 rounded-br-lg"></div>
                      </div>
                      
                      {/* النص التوجيهي */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
                        <div className="bg-black/70 backdrop-blur-sm px-6 py-4 rounded-xl border-2 border-green-400 shadow-lg">
                          <p className="text-white text-xl font-bold mb-1">
                            ضع البابل شيت هنا
                          </p>
                          <p className="text-green-300 text-sm">
                            صفحة {currentPage} من 3
                          </p>
                        </div>
                      </div>
                      
                      {/* مؤشر الصفحة */}
                      <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-bold z-10">
                        صفحة {currentPage}/3
                      </div>
                      
                      {/* مؤشر تنشيط الكاميرا */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className="flex items-center gap-2 bg-green-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                          <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
                          <span className="text-sm font-bold">الكاميرا نشطة</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={captureImage}
                      className="flex-1 h-14 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      data-testid="button-capture"
                    >
                      <Camera className="w-5 h-5 ml-2" />
                      التقاط الصورة
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="h-14 px-6 border-2"
                      data-testid="button-cancel-camera"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Processing */}
        {processing && (
          <Card className="border-2 border-blue-300 dark:border-blue-700">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold">
                    جاري معالجة الصور...
                  </p>
                  <p className="text-lg text-muted-foreground">
                    كشف الإجابات تلقائياً
                  </p>
                </div>
                <Progress value={progress} className="w-full h-3" />
                <p className="text-center text-xl font-semibold text-blue-600">
                  {Math.round(progress)}%
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Preview */}
        {capturedImages.length > 0 && !processing && scanResults.length > 0 && (
          <div className="space-y-6">
            {/* Captured Images */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
                <CardTitle>الصور الملتقطة ({capturedImages.length} صفحة)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {capturedImages.map((imgUrl, idx) => (
                    <div key={idx} className="space-y-2">
                      <p className="text-sm font-bold text-center bg-blue-100 dark:bg-blue-900 py-2 rounded">
                        صفحة {idx + 1}
                      </p>
                      <img 
                        src={imgUrl} 
                        alt={`Captured page ${idx + 1}`} 
                        className="w-full rounded-lg border-2 shadow-md"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  onClick={retake}
                  variant="outline"
                  className="w-full h-12 border-2"
                  data-testid="button-retake"
                >
                  <XCircle className="w-5 h-5 ml-2" />
                  إعادة التصوير
                </Button>
              </CardContent>
            </Card>

            {/* Results Summary */}
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-green-600 to-amber-600 dark:from-green-600 dark:to-amber-600">
                <CardTitle className="text-xl">نتائج المسح والكشف</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-xl border-2 border-green-300 dark:border-green-700 text-center shadow-md">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">تم الكشف</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                      {scanResults.filter(r => r.selectedAnswer !== null).length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-6 rounded-xl border-2 border-red-300 dark:border-red-700 text-center shadow-md">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">غير محددة</p>
                    <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                      {scanResults.filter(r => r.selectedAnswer === null).length}
                    </p>
                  </div>
                </div>

                {/* Detected Answers Grid */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg">الإجابات المكتشفة:</h3>
                  <div className="max-h-80 overflow-y-auto border-2 rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {scanResults.map((result) => (
                        <div
                          key={result.questionNumber}
                          className={`p-3 rounded-lg text-center text-sm font-medium shadow-sm transition-all ${
                            result.selectedAnswer !== null
                              ? 'bg-green-100 dark:bg-green-900/40 border-2 border-green-400 dark:border-green-600'
                              : 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-600'
                          }`}
                        >
                          <div className="font-bold text-base">{result.questionNumber}</div>
                          <div className="text-lg font-bold mt-1">
                            {result.selectedAnswer !== null
                              ? getArabicLetter(result.selectedAnswer)
                              : '—'}
                          </div>
                          {result.selectedAnswer !== null && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {result.confidence}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <AlertDescription>
                    <strong className="text-blue-900 dark:text-blue-100 text-base">مهم جداً:</strong>
                    <ul className="list-disc list-inside mt-3 space-y-2 text-blue-800 dark:text-blue-200">
                      <li>راجع الإجابات المكتشفة بعناية قبل التأكيد</li>
                      <li>الأسئلة غير المحددة ستُعتبر خاطئة في التصحيح</li>
                      <li>إذا كانت النتائج غير دقيقة، استخدم "إعادة التصوير" أو "إدخال النتيجة يدوياً"</li>
                      <li>الأحرف المعروضة: أ = A، ب = B، ج = C، د = D، هـ = E</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={submitAnswers}
                  className="w-full h-16 text-xl bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-600 hover:to-amber-600 shadow-lg"
                  data-testid="button-submit-scan"
                >
                  <CheckCircle className="w-6 h-6 ml-3" />
                  تأكيد النتائج والانتقال للتصحيح
                  <ArrowRight className="w-6 h-6 mr-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

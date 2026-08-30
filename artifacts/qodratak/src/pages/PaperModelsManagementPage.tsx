import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle2, Lock, Calendar, Hash } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaperModel {
  id: number;
  name: string;
  modelNumber: number;
  allQuestions: any[];
  totalQuestions: number;
  verbalCount: number;
  quantitativeCount: number;
  trialVerbalCount: number;
  trialQuantCount: number;
  createdAt?: string;
}

export default function PaperModelsManagementPage() {
  const [selectedModel, setSelectedModel] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ exams: PaperModel[] }>({
    queryKey: ['/api/paper-models'],
  });

  const models = data?.exams || [];
  const selectedModelData = models.find(m => m.modelNumber === selectedModel);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6" data-testid="loading-skeleton">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6" data-testid="page-paper-models">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-600 bg-clip-text text-transparent" data-testid="text-page-title">
              إدارة النماذج الورقية
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2" data-testid="text-page-description">
              جميع النماذج ثابتة ودائمة - آمنة للطباعة والاحتفاظ بها للأبد
            </p>
          </div>
          <div className="flex items-center gap-2" data-testid="badge-stable">
            <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 ml-2" />
              نماذج ثابتة
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-total-models">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                إجمالي النماذج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-total-models">
                {models.length}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-questions-per-model">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                أسئلة كل نموذج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-700" data-testid="text-questions-count">
                120
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-verbal-questions">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                أسئلة لفظية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-verbal-count">
                65
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-quant-questions">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                أسئلة كمية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-quant-count">
                55
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <Card
              key={model.modelNumber}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedModel === model.modelNumber
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                  : ''
              }`}
              onClick={() => setSelectedModel(model.modelNumber)}
              data-testid={`card-model-${model.modelNumber}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span data-testid={`text-model-name-${model.modelNumber}`}>{model.name}</span>
                  </CardTitle>
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                    <Hash className="h-3 w-3 ml-1" />
                    {model.modelNumber}
                  </Badge>
                </div>
                <CardDescription>
                  نموذج ثابت - آمن للطباعة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400">إجمالي الأسئلة</span>
                    <span className="font-semibold text-lg" data-testid={`text-total-questions-${model.modelNumber}`}>
                      {model.totalQuestions}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400">أسئلة تجريبية</span>
                    <span className="font-semibold text-lg" data-testid={`text-trial-questions-${model.modelNumber}`}>
                      {model.trialVerbalCount + model.trialQuantCount}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary" className="flex-1 justify-center bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    لفظي: {model.verbalCount}
                  </Badge>
                  <Badge variant="secondary" className="flex-1 justify-center bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
                    كمي: {model.quantitativeCount}
                  </Badge>
                </div>

                <Button
                  className="w-full"
                  variant={selectedModel === model.modelNumber ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedModel(model.modelNumber);
                  }}
                  data-testid={`button-view-details-${model.modelNumber}`}
                >
                  عرض التفاصيل
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Model Details */}
        {selectedModelData && (
          <Card data-testid="card-model-details">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                تفاصيل {selectedModelData.name}
              </CardTitle>
              <CardDescription>
                قائمة بجميع الأسئلة في النموذج (الأسئلة التجريبية مميزة)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead className="text-center">الموضع</TableHead>
                      <TableHead className="text-center">رقم السؤال</TableHead>
                      <TableHead className="text-center">النوع</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedModelData.allQuestions.slice(0, 30).map((question, index) => (
                      <TableRow
                        key={index}
                        className={question.isTrial ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                        data-testid={`row-question-${index + 1}`}
                      >
                        <TableCell className="text-center font-semibold">
                          {question.position || index + 1}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {question.id}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={
                              question.questionType === 'verbal'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                            }
                          >
                            {question.questionType === 'verbal' ? 'لفظي' : 'كمي'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {question.isTrial ? (
                            <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                              تجريبي
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                              محسوب
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {selectedModelData.allQuestions.length > 30 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
                    عرض أول 30 سؤال من {selectedModelData.allQuestions.length} سؤال
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Notice */}
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" data-testid="card-notice">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
              <Lock className="h-5 w-5" />
              ملاحظة هامة
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700 dark:text-green-300 space-y-2">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                جميع النماذج الورقية <strong>ثابتة ودائمة</strong> - لن تتغير أبداً مع التحديثات
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                يمكن للطلاب طباعة أي نموذج والاحتفاظ به - النسخة المطبوعة ستظل صحيحة للأبد
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                كل نموذج يحتوي على نفس الأسئلة بنفس الترتيب دائماً - لا يوجد توليد عشوائي
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Calendar className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                النماذج محفوظة في ملف JSON دائم في المشروع - آمنة ومحمية من التغيير
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

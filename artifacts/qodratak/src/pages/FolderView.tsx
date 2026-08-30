
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {  
  ArrowLeft,
  Trash2,
  BookOpen,
  GraduationCap
} from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function FolderView() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/folders/:id");
  const { toast } = useToast();
  const folderId = params?.id;

  const { data: folder, isLoading: folderLoading, error: folderError } = useQuery({
    queryKey: ['/api/folders', folderId],
    queryFn: async () => {
      const res = await fetch(`/api/folders/${folderId}`);
      if (!res.ok) throw new Error('Failed to fetch folder');
      return res.json();
    },
    enabled: !!folderId,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/folders', folderId, 'questions'],
    queryFn: async () => {
      const res = await fetch(`/api/folders/${folderId}/questions`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      return res.json();
    },
    enabled: !!folderId && !!folder,
  });

  const removeQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await fetch(`/api/folders/${folderId}/questions/${questionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to remove question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders', folderId, 'questions'] });
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف السؤال من المجلد",
      });
    },
  });

  const handleRemoveQuestion = (questionId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا السؤال من المجلد؟')) {
      removeQuestionMutation.mutate(questionId);
    }
  };

  const handleStartTest = () => {
    if (questions.length === 0) {
      toast({
        title: "⚠️ تنبيه",
        description: "لا توجد أسئلة في هذا المجلد",
        variant: "destructive",
      });
      return;
    }
    navigate(`/test-me?folder=${folderId}`);
  };

  if (folderLoading || questionsLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (folderError || !folder) {
    console.error("خطأ في تحميل المجلد:", folderError);
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {folderError ? "حدث خطأ في تحميل المجلد" : "المجلد غير موجود"}
            </p>
            <Button onClick={() => navigate('/folders')} data-testid="button-back-folders">
              العودة للمجلدات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={() => navigate('/folders')}
          variant="ghost"
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 ml-1" />
          العودة للمجلدات
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
            >
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {folder.name}
              </h1>
              {folder.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {folder.description}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handleStartTest}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-600 hover:to-blue-700"
            disabled={questions.length === 0}
            data-testid="button-start-test"
          >
            <GraduationCap className="h-5 w-5 ml-2" />
            اختبرني ({questions.length} سؤال)
          </Button>
        </div>
      </div>

      {/* Questions */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد أسئلة في هذا المجلد
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ابدأ بحفظ بعض الأسئلة من الاختبارات لهذا المجلد
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question: any, index: number) => (
            <Card key={question._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">سؤال {index + 1}</Badge>
                      {question.subcategory && (
                        <Badge variant="secondary">{question.subcategory}</Badge>
                      )}
                      <Badge className={
                        question.category === 'verbal' 
                          ? 'bg-red-500' 
                          : 'bg-green-500'
                      }>
                        {question.category === 'verbal' ? 'لفظي' : 'كمي'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {question.text}
                    </CardTitle>
                  </div>
                  <Button
                    onClick={() => handleRemoveQuestion(question.questionId)}
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    data-testid={`button-remove-${question.questionId}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {question.options.map((option: string, optIndex: number) => {
                    const isCorrect = optIndex === question.correctOptionIndex;
                    const arabicLetter = String.fromCharCode(1571 + optIndex);

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-lg border ${
                          isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {arabicLetter}
                          </div>
                          <span className="flex-1">{option}</span>
                          {isCorrect && (
                            <Badge className="bg-green-600">الإجابة الصحيحة</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {question.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>الشرح:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

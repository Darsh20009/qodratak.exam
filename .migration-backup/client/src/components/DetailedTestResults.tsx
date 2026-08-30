
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Target,
  Clock,
  Award,
  TrendingUp,
  BookOpen,
  Calculator,
  Star,
  Zap,
  Brain,
  CheckCircle2,
  XCircle,
  BarChart3,
  Sparkles,
  Crown,
  Gem,
  Download,
  FileText
} from "lucide-react";
import { DetailedExamResult, SubcategoryResult } from "@/../../shared/examUtils";

interface DetailedTestResultsProps {
  results: DetailedExamResult;
  examType: string;
  onClose: () => void;
}

export function DetailedTestResults({ results, examType, onClose }: DetailedTestResultsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const generateSubcategoryHTML = async (subcategory: string, result: SubcategoryResult) => {
    // استدعاء API للحصول على الأسئلة
    const response = await fetch(`/api/questions?subcategory=${encodeURIComponent(subcategory)}`);
    const questions = await response.json();
    
    const currentDate = new Date().toLocaleDateString('ar-SA');
    const gradeColor = result.percentage >= 90 ? '#10b981' : 
                      result.percentage >= 80 ? '#3b82f6' : 
                      result.percentage >= 70 ? '#f59e0b' : '#ef4444';
    
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>أسئلة ${subcategory} - قدراتك</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="25" cy="75" r="1" fill="white" opacity="0.05"/><circle cx="75" cy="25" r="1" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
            z-index: 1;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            position: relative;
            z-index: 2;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 25px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .logo {
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .title {
            font-size: 2.5rem;
            color: #2d3748;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: #718096;
            margin-bottom: 20px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.9);
            padding: 25px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }
        
        .stat-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: ${gradeColor};
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 800;
            color: ${gradeColor};
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #718096;
            font-weight: 600;
        }
        
        .questions-container {
            display: grid;
            gap: 30px;
        }
        
        .question-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .question-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
        }
        
        .question-number {
            position: absolute;
            top: -10px;
            right: 20px;
            background: linear-gradient(135deg, ${gradeColor}, ${gradeColor}dd);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .question-text {
            font-size: 1.3rem;
            line-height: 1.8;
            color: #2d3748;
            margin-bottom: 25px;
            font-weight: 500;
        }
        
        .options {
            display: grid;
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .option {
            padding: 15px 20px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: #f7fafc;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .option.correct {
            background: linear-gradient(135deg, #d4edda, #c3e6cb);
            border-color: #28a745;
            color: #155724;
            font-weight: 600;
        }
        
        .option.correct::before {
            content: '✓';
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #28a745;
            font-weight: bold;
            font-size: 1.2rem;
        }
        
        .explanation {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 2px solid #ffc107;
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
            position: relative;
        }
        
        .explanation::before {
            content: '💡';
            position: absolute;
            top: -10px;
            right: 20px;
            background: #ffc107;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .explanation-title {
            font-weight: 700;
            color: #856404;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .explanation-text {
            color: #856404;
            line-height: 1.6;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 30px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .footer-text {
            color: #718096;
            font-size: 1.1rem;
            line-height: 1.6;
        }
        
        .gradient-text {
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 700;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .title { font-size: 2rem; }
            .logo { font-size: 2.5rem; }
            .question-text { font-size: 1.1rem; }
        }
        
        .floating-particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            animation: float 6s infinite ease-in-out;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0; }
            50% { transform: translateY(-100px) rotate(180deg); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="floating-particles">
        ${Array.from({length: 15}, (_, i) => `
            <div class="particle" style="
                left: ${Math.random() * 100}%; 
                animation-delay: ${Math.random() * 6}s;
                animation-duration: ${4 + Math.random() * 4}s;
            "></div>
        `).join('')}
    </div>
    
    <div class="container">
        <div class="header">
            <div class="logo">قدراتك</div>
            <h1 class="title">أسئلة ${subcategory}</h1>
            <p class="subtitle">مجموعة شاملة من الأسئلة التدريبية المتقدمة</p>
            <p class="subtitle">تم الإنشاء في: ${currentDate}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${questions.length}</div>
                <div class="stat-label">إجمالي الأسئلة</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${result.correct}/${result.total}</div>
                <div class="stat-label">أداؤك</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(result.percentage)}%</div>
                <div class="stat-label">النسبة المئوية</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${result.level}</div>
                <div class="stat-label">التقدير</div>
            </div>
        </div>
        
        <div class="questions-container">
            ${questions.map((q: any, index: number) => `
                <div class="question-card">
                    <div class="question-number">${index + 1}</div>
                    <div class="question-text">${q.question}</div>
                    <div class="options">
                        ${q.choices.map((choice: string, choiceIndex: number) => `
                            <div class="option ${choiceIndex === parseInt(q.correct_answer) ? 'correct' : ''}">
                                ${String.fromCharCode(65 + choiceIndex)}) ${choice}
                            </div>
                        `).join('')}
                    </div>
                    ${q.explanation ? `
                        <div class="explanation">
                            <div class="explanation-title">الشرح والتوضيح:</div>
                            <div class="explanation-text">${q.explanation}</div>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <div class="footer-text">
                تم إنشاء هذا الملف بواسطة منصة <span class="gradient-text">قدراتك</span> 
                <br>
                منصة شاملة لتطوير القدرات والاستعداد للاختبارات المعيارية
                <br>
                <strong>التعليم حق للجميع</strong>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  };

  const downloadSubcategoryQuestions = async (subcategory: string, result: SubcategoryResult) => {
    try {
      const htmlContent = await generateSubcategoryHTML(subcategory, result);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `اسئلة_${subcategory.replace(/\s+/g, '_')}_${new Date().getTime()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('خطأ في تحميل الأسئلة:', error);
    }
  };

  const downloadCompleteReport = async () => {
    try {
      const currentDate = new Date().toLocaleDateString('ar-SA');
      const overallGradeColor = results.overallPercentage >= 90 ? '#10b981' : 
                               results.overallPercentage >= 80 ? '#3b82f6' : 
                               results.overallPercentage >= 70 ? '#f59e0b' : '#ef4444';
      
      const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التقرير الشامل - ${examType} - قدراتك</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f3d 100%);
            min-height: 100vh;
            color: white;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 75% 75%, rgba(255, 119, 198, 0.1) 0%, transparent 50%);
            pointer-events: none;
            z-index: 1;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px;
            position: relative;
            z-index: 2;
        }
        
        .header {
            text-align: center;
            margin-bottom: 50px;
            background: rgba(255, 255, 255, 0.1);
            padding: 50px;
            border-radius: 30px;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%; left: -50%; width: 200%; height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05), transparent);
            animation: shimmer 4s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .logo {
            font-size: 4rem;
            font-weight: 900;
            background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
        }
        
        .title {
            font-size: 3rem;
            margin-bottom: 15px;
            font-weight: 800;
            background: linear-gradient(135deg, #fff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            font-size: 1.4rem;
            opacity: 0.8;
            margin-bottom: 10px;
        }
        
        .exam-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 25px;
            margin: 50px 0;
        }
        
        .info-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            backdrop-filter: blur(15px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .info-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .info-card::after {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 4px;
            background: ${overallGradeColor};
        }
        
        .info-value {
            font-size: 3rem;
            font-weight: 900;
            color: ${overallGradeColor};
            margin-bottom: 10px;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }
        
        .info-label {
            font-size: 1.1rem;
            opacity: 0.9;
            font-weight: 600;
        }
        
        .section {
            margin-bottom: 50px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 25px;
            padding: 40px;
            backdrop-filter: blur(15px);
            border: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .section-title {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 30px;
            text-align: center;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subcategory-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
        }
        
        .subcategory-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            position: relative;
            transition: all 0.3s ease;
        }
        
        .subcategory-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
        }
        
        .subcategory-name {
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 15px;
            color: #fff;
        }
        
        .performance-bar {
            width: 100%;
            height: 12px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            overflow: hidden;
            margin: 15px 0;
        }
        
        .performance-fill {
            height: 100%;
            background: linear-gradient(90deg, ${overallGradeColor}, ${overallGradeColor}aa);
            border-radius: 6px;
            transition: width 2s ease;
        }
        
        .stats {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 1.2rem;
            font-weight: 700;
            color: ${overallGradeColor};
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.7;
        }
        
        .achievements {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 30px;
        }
        
        .achievement {
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #333;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 0.9rem;
            box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
        }
        
        .footer {
            text-align: center;
            margin-top: 60px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 25px;
            backdrop-filter: blur(15px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .footer-text {
            font-size: 1.2rem;
            line-height: 1.8;
            opacity: 0.9;
        }
        
        .gradient-text {
            background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 800;
        }
        
        @media (max-width: 768px) {
            .container { padding: 15px; }
            .title { font-size: 2rem; }
            .logo { font-size: 2.5rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">قدراتك</div>
            <h1 class="title">التقرير الشامل - ${examType}</h1>
            <p class="subtitle">تحليل مفصل وشامل للأداء والنتائج</p>
            <p class="subtitle">تم الإنشاء في: ${currentDate}</p>
        </div>
        
        <div class="exam-info">
            <div class="info-card">
                <div class="info-value">${results.totalScore}/${results.totalQuestions}</div>
                <div class="info-label">إجمالي النقاط</div>
            </div>
            <div class="info-card">
                <div class="info-value">${Math.round(results.overallPercentage)}%</div>
                <div class="info-label">النسبة المئوية</div>
            </div>
            <div class="info-card">
                <div class="info-value">${results.level}</div>
                <div class="info-label">التقدير العام</div>
            </div>
            <div class="info-card">
                <div class="info-value">${formatTime(results.timeTaken)}</div>
                <div class="info-label">الوقت المستغرق</div>
            </div>
        </div>
        
        ${results.verbalResults.length > 0 ? `
        <div class="section">
            <h2 class="section-title">🎯 القسم اللفظي</h2>
            <div class="subcategory-grid">
                ${results.verbalResults.map(result => `
                    <div class="subcategory-card">
                        <div class="subcategory-name">${result.subcategory}</div>
                        <div class="performance-bar">
                            <div class="performance-fill" style="width: ${result.percentage}%"></div>
                        </div>
                        <div class="stats">
                            <div class="stat">
                                <div class="stat-value">${result.correct}</div>
                                <div class="stat-label">صحيح</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${Math.round(result.percentage)}%</div>
                                <div class="stat-label">النسبة</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${result.total - result.correct}</div>
                                <div class="stat-label">خطأ</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${results.quantitativeResults.length > 0 ? `
        <div class="section">
            <h2 class="section-title">🔢 القسم الكمي</h2>
            <div class="subcategory-grid">
                ${results.quantitativeResults.map(result => `
                    <div class="subcategory-card">
                        <div class="subcategory-name">${result.subcategory}</div>
                        <div class="performance-bar">
                            <div class="performance-fill" style="width: ${result.percentage}%"></div>
                        </div>
                        <div class="stats">
                            <div class="stat">
                                <div class="stat-value">${result.correct}</div>
                                <div class="stat-label">صحيح</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${Math.round(result.percentage)}%</div>
                                <div class="stat-label">النسبة</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${result.total - result.correct}</div>
                                <div class="stat-label">خطأ</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${results.achievements.length > 0 ? `
        <div class="section">
            <h2 class="section-title">🏆 الإنجازات المحققة</h2>
            <div class="achievements">
                ${results.achievements.map(achievement => `
                    <div class="achievement">✨ ${achievement}</div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="footer">
            <div class="footer-text">
                تم إنشاء هذا التقرير بواسطة منصة <span class="gradient-text">قدراتك</span> 
                <br>
                منصة شاملة لتطوير القدرات والاستعداد للاختبارات المعيارية
                <br>
                <strong>التعليم حق للجميع</strong>
            </div>
        </div>
    </div>
</body>
</html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_شامل_${examType.replace(/\s+/g, '_')}_${new Date().getTime()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('خطأ في تحميل التقرير الشامل:', error);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "from-emerald-500 via-green-400 to-teal-400";
    if (percentage >= 80) return "from-blue-500 via-cyan-400 to-teal-500";
    if (percentage >= 70) return "from-yellow-500 via-amber-400 to-orange-400";
    return "from-red-500 via-pink-400 to-rose-400";
  };

  const getGradientBackground = (percentage: number) => {
    if (percentage >= 90) return "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20";
    if (percentage >= 80) return "bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-500 dark:from-blue-950/20 dark:via-cyan-950/20 dark:to-teal-500/20";
    if (percentage >= 70) return "bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-orange-950/20";
    return "bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-red-950/20 dark:via-pink-950/20 dark:to-rose-950/20";
  };

  const SubcategoryCard = ({ result, icon }: { result: SubcategoryResult; icon: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.2 }
      }}
      className={`${getGradientBackground(result.percentage)} relative overflow-hidden backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300`}
    >
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradeColor(result.percentage)} flex items-center justify-center text-white shadow-2xl`}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                {icon}
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1">
                {result.subcategory}
              </h4>
              <Badge className={`text-sm font-semibold px-3 py-1 ${
                result.percentage >= 90 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 border-emerald-300' :
                result.percentage >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 border-blue-300' :
                result.percentage >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 border-yellow-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 border-red-300'
              }`}>
                {result.level}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <motion.div 
              className="text-2xl font-bold text-gray-800 dark:text-white mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {result.correct}/{result.total}
            </motion.div>
            <div className="text-lg text-gray-600 dark:text-gray-300 font-semibold">
              {Math.round(result.percentage)}%
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <Progress 
              value={result.percentage} 
              className="h-3 bg-white/50"
            />
            <motion.div
              className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-green-600 to-amber-600 opacity-50"
              initial={{ width: 0 }}
              animate={{ width: `${result.percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-sm mb-4">
            <motion.span 
              className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium"
              whileHover={{ scale: 1.05 }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {result.correct} صحيح
            </motion.span>
            <motion.span 
              className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium"
              whileHover={{ scale: 1.05 }}
            >
              <XCircle className="w-4 h-4" />
              {result.total - result.correct} خطأ
            </motion.span>
          </div>
          
          {/* زر التحميل الإبداعي */}
          <motion.button
            onClick={() => downloadSubcategoryQuestions(result.subcategory, result)}
            className={`w-full p-3 rounded-xl bg-gradient-to-r ${getGradeColor(result.percentage)} text-white font-semibold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative z-10"
            >
              <Download className="w-4 h-4" />
            </motion.div>
            <span className="relative z-10">تحميل ملف الأسئلة الإبداعي</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative z-10"
            >
              <FileText className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* خلفية متحركة مبدعة */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-blue-900 to-teal-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%25239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        {/* جزيئات متحركة */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              x: [0, Math.random() * window.innerWidth, 0],
              y: [0, Math.random() * window.innerHeight, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto border border-white/20"
        >
          {/* Header فاخر */}
          <div className="relative bg-gradient-to-r from-green-600 via-blue-600 to-teal-500 text-white p-10 rounded-t-3xl overflow-hidden">
            {/* تأثيرات خلفية فاخرة */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/50 via-blue-800/50 to-teal-500/50"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center relative z-10"
            >
              <motion.div
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 mb-6 relative"
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.6 }}
              >
                <BarChart3 className="w-12 h-12" />
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Crown className="w-3 h-3 text-yellow-800" />
                </motion.div>
              </motion.div>
              
              <motion.h2 
                className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                📊 النتائج التفصيلية الفاخرة
              </motion.h2>
              
              <motion.p 
                className="text-white/90 text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                تحليل شامل ومتقدم لأدائك في {examType === 'qiyas' ? 'اختبار قياس' : 'الاختبار التأهيلي'}
              </motion.p>
            </motion.div>
            
            <motion.button
              onClick={onClose}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-2xl">✕</span>
            </motion.button>
          </div>

          <div className="p-10 space-y-10">
            {/* الأداء العام الفاخر */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-r from-teal-600 via-green-600 to-amber-600 dark:from-teal-600/30 dark:via-green-600/30 dark:to-amber-600/30 border-2 border-teal-400 dark:border-teal-400 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600/5 via-green-600/5 to-amber-600/5"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    </motion.div>
                    الأداء العام الفاخر
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-green-700" />
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                      { value: `${results.totalScore}/${results.totalQuestions}`, label: "إجمالي النقاط", icon: Target, color: "text-gray-800 dark:text-white" },
                      { value: `${Math.round(results.overallPercentage)}%`, label: "النسبة المئوية", icon: BarChart3, color: "text-blue-600 dark:text-blue-400" },
                      { value: results.level, label: "المستوى", icon: Crown, color: "text-green-600 dark:text-green-400" },
                      { value: formatTime(results.timeTaken), label: "الوقت المستغرق", icon: Clock, color: "text-green-700 dark:text-green-700" }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        className="text-center relative"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index, type: "spring" }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.div
                          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-lg mb-3"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <item.icon className="w-6 h-6 text-green-700" />
                        </motion.div>
                        <div className={`text-3xl font-bold mb-2 ${item.color}`}>
                          {item.value}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{item.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-8">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="origin-left"
                    >
                      <Progress 
                        value={results.overallPercentage} 
                        className="h-6 bg-gradient-to-r from-gray-200 to-gray-300"
                      />
                    </motion.div>
                  </div>
                  
                  {/* زر تحميل التقرير الشامل */}
                  <div className="mt-8">
                    <motion.button
                      onClick={() => downloadCompleteReport()}
                      className="w-full p-4 rounded-2xl bg-gradient-to-r from-green-600 via-blue-600 to-teal-500 text-white font-bold text-lg flex items-center justify-center gap-4 shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden group"
                      whileHover={{ scale: 1.02, y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <motion.div
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.1, 1] 
                        }}
                        transition={{ 
                          rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity }
                        }}
                        className="relative z-10"
                      >
                        <Download className="w-6 h-6" />
                      </motion.div>
                      <span className="relative z-10">تحميل التقرير الشامل الإبداعي</span>
                      <motion.div
                        animate={{ 
                          rotate: [0, -360],
                          scale: [1, 1.2, 1] 
                        }}
                        transition={{ 
                          rotate: { duration: 2.5, repeat: Infinity, ease: "linear" },
                          scale: { duration: 1.8, repeat: Infinity }
                        }}
                        className="relative z-10"
                      >
                        <FileText className="w-6 h-6" />
                      </motion.div>
                    </motion.button>
                  </div>

                  {/* الإنجازات الفاخرة */}
                  {results.achievements.length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3 text-lg">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <Award className="w-6 h-6 text-yellow-500" />
                        </motion.div>
                        الإنجازات المحققة
                        <Gem className="w-5 h-5 text-green-700" />
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {results.achievements.map((achievement, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ delay: index * 0.1, type: "spring", bounce: 0.5 }}
                            whileHover={{ scale: 1.1, y: -2 }}
                          >
                            <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-300 px-4 py-2 text-sm font-semibold border border-yellow-300">
                              ✨ {achievement}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* القسم اللفظي الفاخر */}
            {results.verbalResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-2xl"
                    whileHover={{ scale: 1.1, rotate: 12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BookOpen className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">القسم اللفظي الفاخر</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">تفصيل متقدم للأداء في الأقسام اللفظية</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.verbalResults.map((result, index) => (
                    <motion.div
                      key={result.subcategory}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <SubcategoryCard
                        result={result}
                        icon={
                          result.subcategory.includes('التناظر') ? <Target className="w-6 h-6" /> :
                          result.subcategory.includes('إكمال') ? <BookOpen className="w-6 h-6" /> :
                          result.subcategory.includes('استيعاب') ? <Brain className="w-6 h-6" /> :
                          <Star className="w-6 h-6" />
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* القسم الكمي الفاخر */}
            {results.quantitativeResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-2xl"
                    whileHover={{ scale: 1.1, rotate: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Calculator className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">القسم الكمي الفاخر</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">تفصيل متقدم للأداء في الأقسام الكمية</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.quantitativeResults.map((result, index) => (
                    <motion.div
                      key={result.subcategory}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <SubcategoryCard
                        result={result}
                        icon={
                          result.subcategory.includes('الهندسة') ? <Target className="w-6 h-6" /> :
                          result.subcategory.includes('عمليات') ? <Calculator className="w-6 h-6" /> :
                          result.subcategory.includes('النسبة') ? <BarChart3 className="w-6 h-6" /> :
                          <Zap className="w-6 h-6" />
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* نصائح التحسين الفاخرة */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 border-2 border-amber-200 dark:border-amber-800 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <TrendingUp className="w-8 h-8 text-amber-600" />
                    </motion.div>
                    نصائح التحسين الفاخرة
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-6 h-6 text-orange-500" />
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h4 className="font-bold text-gray-800 dark:text-white mb-4 text-lg flex items-center gap-2">
                        <Crown className="w-5 h-5 text-green-500" />
                        نقاط القوة:
                      </h4>
                      <ul className="space-y-3">
                        {[...results.verbalResults, ...results.quantitativeResults]
                          .filter(r => r.percentage >= 80)
                          .slice(0, 3)
                          .map((result, index) => (
                            <motion.li 
                              key={index} 
                              className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index }}
                              whileHover={{ scale: 1.02, x: 5 }}
                            >
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <span className="text-sm font-medium">أداء ممتاز في {result.subcategory}</span>
                            </motion.li>
                          ))}
                      </ul>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h4 className="font-bold text-gray-800 dark:text-white mb-4 text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        مجالات التحسين:
                      </h4>
                      <ul className="space-y-3">
                        {[...results.verbalResults, ...results.quantitativeResults]
                          .filter(r => r.percentage < 70)
                          .slice(0, 3)
                          .map((result, index) => (
                            <motion.li 
                              key={index} 
                              className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index }}
                              whileHover={{ scale: 1.02, x: -5 }}
                            >
                              <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              <span className="text-sm font-medium">ركز أكثر على {result.subcategory}</span>
                            </motion.li>
                          ))}
                      </ul>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

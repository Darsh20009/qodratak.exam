import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BookOpenIcon, 
  Calculator,
  PlayCircleIcon,
  StarIcon,
  UsersIcon,
  ClockIcon,
  CrownIcon,
  GiftIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MonitorIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  BookIcon,
  TargetIcon,
  AwardIcon,
  BarChart3Icon,
  LockIcon,
  RocketIcon,
  ZapIcon,
  FlameIcon,
  ShieldIcon,
  DiamondIcon,
  SparklesIcon,
  GraduationCapIcon,
  BrainIcon,
  SearchIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "wouter";

interface LearningModule {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'foundation' | 'computer-based' | 'leaked-paper' | 'taqfeelat';
  duration: string;
  progress: number;
  isCompleted: boolean;
  order: number;
}

interface CourseSection {
  id: string;
  title: string;
  description: string;
  type: 'verbal' | 'quantitative';
  icon: React.ReactNode;
  color: string;
  modules: LearningModule[];
  methodology: string[];
  totalProgress: number;
}

const computerBasedUrls = [
  "https://drive.google.com/file/d/1ilaB-nqnlYDBJp5fB5mVZ1couQuLSnwN/view?usp=sharing",
  "https://drive.google.com/file/d/1GWBIHYC7ypV0wjbYiUEyj-8p0cWAqFm0/view?usp=sharing",
  "https://drive.google.com/file/d/1VzTRAzECz4HGd85cytMf7Vnbp-Dg5CI0/view?usp=sharing",
  "https://drive.google.com/file/d/1QOqZ-rBQmQ_-_yHCG-qDiOi69k_DWqpX/view?usp=sharing",
  "https://drive.google.com/file/d/1wmNboywaV3PUEeSlAPyr4f1sOxNFbzJ3/view?usp=sharing",
  "https://drive.google.com/file/d/1nEYk5luTQnohbyKdtp3mbvOevNv0jJ_c/view?usp=sharing",
  "https://drive.google.com/file/d/1H0Zuk_BA2mEHnG2BL9BhGfOUiYtKW6lW/view?usp=sharing",
  "https://drive.google.com/file/d/1nZKENdc7e20lKcnjUtupt0ja1kHP4NVf/view?usp=sharing",
  "https://drive.google.com/file/d/106ImXm_GAp3S-V5TEcFhduCwGj5SBKh6/view?usp=sharing",
  "https://drive.google.com/file/d/1u3AhFjwSRAMJ3aPTOrVXhjG8imvp0qzN/view?usp=sharing",
  "https://drive.google.com/file/d/1prnEpxtJC41GFJuu-cLR_3zpiqI2zAq7/view?usp=sharing",
  "https://drive.google.com/file/d/1u0Hlvm6OmiiPw-UMOf5AweYwalbr4WaZ/view?usp=sharing",
  "https://drive.google.com/file/d/1edzLdR0aGEYqNPGEnftFJORjF3Rp8o6s/view?usp=sharing",
  "https://drive.google.com/file/d/18MCbtyFgk0Po66WYymJLRP92iDqcnSHx/view?usp=sharing",
  "https://drive.google.com/file/d/1YtIkVJTIUoFyFs8xRWUB4lh_vlY-fWc_/view?usp=sharing",
  "https://drive.google.com/file/d/1g0oGG1kt-YMHwpiu8xJGVO4imJj7glBH/view?usp=sharing",
  "https://drive.google.com/file/d/1t1kbsqyDXF-RYarRYMwwUdTv5tWkVnBJ/view?usp=sharing",
  "https://drive.google.com/file/d/1oE9MLd4cfjhkzciQSHm4M3Rxf9jgNf7-/view?usp=sharing",
  "https://drive.google.com/file/d/1w_LIbyLPKY4a-GWS9gfT8rK0bQyVQahc/view?usp=sharing",
  "https://drive.google.com/file/d/1FhNzgfKNJWF3sFOXJsD0g34SvAkQ5_TT/view?usp=sharing",
  "https://drive.google.com/file/d/1Aw9Fqn15DLGs3u8lK3G1_MEkWxrGSnzG/view?usp=sharing",
  "https://drive.google.com/file/d/13x8NupsyjmE3PZm7oADVoLcApHXpLHyY/view?usp=sharing",
  "https://drive.google.com/file/d/1PtysifuHyAka8LpD9_PWmCXueJyjfyGt/view?usp=sharing",
  "https://drive.google.com/file/d/1y_mRUP-w8X5H8qyNKU-GnVU13r3ZvMJa/view?usp=sharing",
  "https://drive.google.com/file/d/18LqbDHEQ1DAVtTKw9lE4uQ04uf-hnnoh/view?usp=sharing",
  "https://drive.google.com/file/d/1OPjfP2RkyiOYvbt-kJN4J43ETHD8eLLP/view?usp=sharing",
  "https://drive.google.com/file/d/16qk-i-440NuI2FeuTCks4INXBcnqGnyx/view?usp=sharing",
  "https://drive.google.com/file/d/1L7JuT_9MG8fQuztp1soDmGRnqCwL_qqe/view?usp=sharing",
  "https://drive.google.com/file/d/12ekVklhqZlPTeQRBhgN2dMDfA-5eM66t/view?usp=sharing",
  "https://drive.google.com/file/d/1YhTkYHUd91qEba623ASwwgpXpaBQrbxD/view?usp=sharing",
  "https://drive.google.com/file/d/1aQzhSNiE7MCGg7HQiQ7VKvSn5a52ENyx/view?usp=sharing",
  "https://drive.google.com/file/d/1cFWqUssF98yvMxJr0B8a5vv4nAgR-AKX/view?usp=sharing",
  "https://drive.google.com/file/d/1fUIf0UbYYHCpJ_y1p8furpIAwqCTQDVZ/view?usp=sharing",
  "https://drive.google.com/file/d/1jYcah2_1kmhSLHilLq6Yejn3QVEB42h2/view?usp=sharing",
  "https://drive.google.com/file/d/10d1141n5OtdIVroMqOKPaGVwyPgpW-wD/view?usp=sharing",
  "https://drive.google.com/file/d/1Un38rtXWpSw5i3OS4fJVoU6stL_pgIA-/view?usp=sharing",
  "https://drive.google.com/file/d/1JIm97pEnPmcmzR1_CCUbxZ5FJS7zYHi2/view?usp=sharing",
  "https://drive.google.com/file/d/1vNI3rg8NI2b6Dc-q8C6u0s7rqS9pZgN6/view?usp=sharing",
  "https://drive.google.com/file/d/1gFzQ9ZMcjmxYAKo4VVIGfreKpAe8PGDZ/view?usp=sharing",
  "https://drive.google.com/file/d/1eghFWIRHbHy30w93nn9XExOxVit0Uf1N/view?usp=sharing",
  "https://drive.google.com/file/d/1hrt9nrnyYWEuz7C3N8cGulNe5nV2d6ch/view?usp=sharing",
  "https://drive.google.com/file/d/1mHsoWxaAkDvmtEJUk0-lZoisdHT6xgc/view?usp=sharing",
  "https://drive.google.com/file/d/15K5QXyUVRob-HtxjX4N3U4Q-AtEJ_Vko/view?usp=sharing",
  "https://drive.google.com/file/d/1PlTkzJWhzIuNS7AYL0KIjklqW30TanBZ/view?usp=sharing",
  "https://drive.google.com/file/d/1dEZ779rPbKTA7n5KHUEG6P8cSmx2ugbB/view?usp=sharing",
  "https://drive.google.com/file/d/1ngITV2yrx5HmuQTIwxSwwqdxg5gKqsjx/view?usp=sharing",
  "https://drive.google.com/file/d/1AQAmocgiH8y5tkkqI2EOdVER6-tXF8XQ/view?usp=sharing",
  "https://drive.google.com/file/d/16_pSjatDYlbPX7ecDilcTwqeWtrGmwrV/view?usp=sharing",
  "https://drive.google.com/file/d/1E2zxiE3sVNeW7ofVCNM1etej6x-bwtSi/view?usp=sharing",
  "https://drive.google.com/file/d/1XfrMz7cyvazSGm7bdrL51RQVp34Sdbc8/view?usp=sharing",
  "https://drive.google.com/file/d/1_kzkSskP9j9MZyU6shvaviSnSBw7DKSb/view?usp=sharing",
  "https://drive.google.com/file/d/1j0_XpxRf4j5fEC4JnVJup-uVI-NxLJQ/view?usp=sharing",
  "https://drive.google.com/file/d/1RnJkH_LEPBqSiRvodvJ3ZhZ2YnWQHXYZ/view?usp=sharing",
  "https://drive.google.com/file/d/19HsLb4fVitwL9iycA5WZ8Hiy0Oud232u/view?usp=sharing",
  "https://drive.google.com/file/d/1SwrSzYOXOmITqIS68zdJsv-jbbYtrodr/view?usp=sharing",
  "https://drive.google.com/file/d/1EFo8iX2HYdtprQmEbg599IRqlF01sQYA/view?usp=sharing",
  "https://drive.google.com/file/d/1HBln2jRYqaO-6lhZwT2Kihx4Aglzwkgh/view?usp=sharing",
  "https://drive.google.com/file/d/1gDRhSqHmPd-AOTmpdvEN8uhGcvV2obVg/view?usp=sharing",
  "https://drive.google.com/file/d/1VnzOS7VFJJWMBeuIGK-sxdgWakB2lbz5/view?usp=sharing",
  "https://drive.google.com/file/d/1ye9sYIRqSFixMOWanX8AKRs6QiQVz1ih/view?usp=sharing",
  "https://drive.google.com/file/d/1suUNARjR_LlAfp5nOuvBjPr5Bx1fm4UV/view?usp=sharing",
  "https://drive.google.com/file/d/1knxPHcYvMTuL5xKGqLxVR0oY_x1n0sVa/view?usp=sharing",
  "https://drive.google.com/file/d/1jz9HMGlLbiIRZjSbJR8RZ9T6b6tbBZve/view?usp=sharing",
  "https://drive.google.com/file/d/1Pd1yli63qiKntVzMkfI_MD4Mft9PYDh3/view?usp=sharing",
  "https://drive.google.com/file/d/1bBmhbUZ9hvydAvxNjpFSilj74XalkVwi/view?usp=sharing",
  "https://drive.google.com/file/d/1ewpl0ecrDlu0GxIZttXMyMI8qPiTQmeS/view?usp=sharing",
  "https://drive.google.com/file/d/15ypIfqb9ODeFFh6EQNY9X8o9CDDM1aAj/view?usp=sharing",
  "https://drive.google.com/file/d/15U3-h3w6QlATQTvVEfKfNPzfRzPd6qBy/view?usp=sharing",
  "https://drive.google.com/file/d/1qF3vznBEU8CcAOLEBVDdYvS2wNPuL_Hg/view?usp=sharing",
  "https://drive.google.com/file/d/17YCu766KBe8FRW5rPL_AsSPq_27Ck4JD/view?usp=sharing",
  "https://drive.google.com/file/d/1UEcj8hl_BVoAF4bx6FgkPtG0lvac4xpX/view?usp=sharing",
  "https://drive.google.com/file/d/144FgjJ2-3PwVvsV2EuV5x63p8IOdGw4X/view?usp=sharing",
  "https://drive.google.com/file/d/1tAAHRz265FIEt4oQ-fbLwjI7iQgld6aR/view?usp=sharing",
  "https://drive.google.com/file/d/1CPQfKWTs1qgIr-zPVO82b2-NWcnKbXzY/view?usp=sharing",
  "https://drive.google.com/file/d/1g3Sm3Y3G4R8VYxu8PwG_u1N6kuCGQElZ/view?usp=sharing",
  "https://drive.google.com/file/d/1veA4AgT2S0TwbdciGjFCLUNX-NwP4irq/view?usp=sharing",
  "https://drive.google.com/file/d/1Qa7nAa9zzAJYFQfxDXLWnrwhKIzDu_lr/view?usp=sharing",
  "https://drive.google.com/file/d/1N_dgOv46mE6ke-MS4zE2tIvJVeffRQyN/view?usp=sharing",
  "https://drive.google.com/file/d/1wq4E0u_xfokS1rYbGOXofonYwErQNI_2/view?usp=sharing",
  "https://drive.google.com/file/d/1VwOJajVYweuXepfhrXKdBOybiZnk4jfJ/view?usp=sharing",
  "https://drive.google.com/file/d/1m22p2VC45WDs1sxQdsu2lBIWSqiy-lwA/view?usp=sharing",
  "https://drive.google.com/file/d/1RpiZW6RrbpWEfI9iDzYJspbkD7NooCcn/view?usp=sharing",
  "https://drive.google.com/file/d/1vUz7HfhTzInbgHB0gct6Dbdo-M-om3Ka/view?usp=sharing",
  "https://drive.google.com/file/d/1jhVQ9rue1rJZ0vGfldf6yawJaGRbmmh-/view?usp=sharing",
  "https://drive.google.com/file/d/1mn2iNZQMC7w1uHG43-BFJHzHLsl2HXvg/view?usp=sharing",
  "https://drive.google.com/file/d/170XML9_m7NvpSBjMBIqGS7EHjue0pHBz/view?usp=sharing",
  "https://drive.google.com/file/d/1poB3e_8nH880AXArYLM2t6XE8jBilxQA/view?usp=sharing",
  "https://drive.google.com/file/d/1HCPNxCmNtqkxZel6BGT0C3IbxxNK0u9f/view?usp=sharing",
  "https://drive.google.com/file/d/17DRvSUejc4fkMKhcN17j9j6Sz6jXH-ON/view?usp=sharing",
  "https://drive.google.com/file/d/1DJFByHPV3255UA50LSU_aw2U9HVkMFFF/view?usp=sharing",
  "https://drive.google.com/file/d/1V0F3Vi-pBFZnpgzZzydJOIkosnPGIR8d/view?usp=sharing",
  "https://drive.google.com/file/d/1m3MD-w15QdjfIDgyWXNxXvZ6Y-vwFxLD/view?usp=sharing",
  "https://drive.google.com/file/d/1LLsuibb4nKT5qFloXBZBYs_Wi-2ZYH0n/view?usp=sharing",
  "https://drive.google.com/file/d/17lV5K0FDE_hYEPJEPlZ-AIN6qa7StC8R/view?usp=sharing",
  "https://drive.google.com/file/d/1KpoY57BhlThmlIDH1EJ5wS15b5pcam37/view?usp=sharing",
  "https://drive.google.com/file/d/1FgmTDTLlOKuBvFl1odeSTFWiqNWZNjR0/view?usp=sharing",
  "https://drive.google.com/file/d/10HOB6FWtBC06Jv-nGwGqM9uUrRI2OQdr/view?usp=sharing" ,
  "https://drive.google.com/file/d/1l2ZC_YjiMGWRGsF1_ngb5UAW8yBAQsj3/view?usp=sharing" ,
  "https://drive.google.com/file/d/11Jum0KAOAJvIoQ9Zj8RPjNSE-LPfIybk/view?usp=sharing", 
  "https://drive.google.com/file/d/1avvojWdNwPX6mfj71KXr4vjbTdzvYwEi/view?usp=sharing" ,
  "https://drive.google.com/file/d/1cIb8EzOdFGa-4ZsHJFjD9yqG4DX0JXud/view?usp=sharing" ,
  "https://drive.google.com/file/d/1eqDoaX3Y3vrfZY20e-laFvK-GZiF1v0r/view?usp=sharing" ,
  "https://drive.google.com/file/d/1ZuG3W1CZ8dAb0SLRPg-zgCGC2yQ7IMfE/view?usp=sharing" ,
  "https://drive.google.com/file/d/1njc1GBM4ilClhnOg-EOmW-rI1MsTK86k/view?usp=sharing"
  ];

// Pad to 100 modules with placeholders if needed
for (let i = computerBasedUrls.length + 1; i <= 100; i++) {
  computerBasedUrls.push(`https://drive.google.com/file/d/placeholder-${i}/view?usp=sharing`);
}

const courseSections: CourseSection[] = [
  {
    id: 'verbal',
    title: 'القدرات اللفظية 🎯',
    description: 'تطوير مهارات الفهم والاستيعاب اللفظي من خلال برنامج تدريبي شامل',
    type: 'verbal',
    icon: <BrainIcon className="w-8 h-8" />,
    color: 'from-green-600 via-green-500 to-teal-500',
    methodology: [
      '🔥 ابدأ بمرحلة التأسيس لفهم القواعد والأسس',
      '💎 اتقن المفاهيم من خلال الملفات التأسيسية',
      '🚀 انتقل للمراجعة المحوسبة للتطبيق العملي',
      '⚡ اختبر نفسك بالتسريبات الورقية للتقييم النهائي'
    ],
    modules: [
      {
        id: 'verbal-foundation',
        title: '🏗️ التأسيس اللفظي الشامل',
        description: 'ملف التأسيس الأساسي للقدرات اللفظية - بناء القواعد والأسس المتينة',
        url: 'https://drive.google.com/file/d/1trZBHpzWxIEXZJ054TWJeEka1kyfovn0/view?usp=sharing',
        type: 'foundation',
        duration: '4 ساعات تفاعلية',
        progress: 0,
        isCompleted: false,
        order: 1
      },
      {
        id: 'verbal-computer-1',
        title: '💻 المراجعة المحوسبة - الجزء الأول',
        description: 'التطبيق العملي والمراجعة المحوسبة للمفاهيم الأساسية',
        url: 'https://drive.google.com/file/d/1aTSifAQWhZbN9E3hH1lSFHv4kRC0d2n2/view?usp=sharing',
        type: 'computer-based',
        duration: '2 ساعة تطبيقية',
        progress: 0,
        isCompleted: false,
        order: 2
      },
      {
        id: 'verbal-computer-2',
        title: '⚡ المراجعة المحوسبة - الجزء الثاني',
        description: 'تمارين متقدمة ومراجعة شاملة للمفاهيم المتطورة',
        url: 'https://drive.google.com/file/d/1jJKK4o1Cc59zVesdQR3VpcOL2GwC_km-/view?usp=sharing',
        type: 'computer-based',
        duration: '2 ساعة متقدمة',
        progress: 0,
        isCompleted: false,
        order: 3
      },
      {
        id: 'verbal-computer-3',
        title: '🎯 المراجعة المحوسبة - الجزء الثالث',
        description: 'تطبيقات عملية وحلول نموذجية للأسئلة المعقدة',
        url: 'https://drive.google.com/file/d/17nRJ94nQ-PgDRxkkbIDeiwFoSUT08UjY/view?usp=sharing',
        type: 'computer-based',
        duration: '2 ساعة عملية',
        progress: 0,
        isCompleted: false,
        order: 4
      },
      {
        id: 'verbal-computer-4',
        title: '🔥 المراجعة المحوسبة - الجزء الرابع',
        description: 'اختبارات تفاعلية ومراجعة نهائية قبل الاختبار',
        url: 'https://drive.google.com/file/d/1VdxJPZG74R1Q0PgINT4s06XKwBB5VxVY/view?usp=sharing',
        type: 'computer-based',
        duration: '2 ساعة تفاعلية',
        progress: 0,
        isCompleted: false,
        order: 5
      },
      {
        id: 'verbal-computer-5',
        title: '⭐ المراجعة المحوسبة - الجزء الخامس',
        description: 'مراجعة متقدمة وتمارين إضافية للإتقان الكامل',
        url: 'https://drive.google.com/file/d/1-83LpA6VmlraEdcK-5d-H9oTVcaOn2cG/view?usp=sharing',
        type: 'computer-based',
        duration: '2 ساعة إتقان',
        progress: 0,
        isCompleted: false,
        order: 6
      },
      {
        id: 'verbal-computer-6',
        title: '🌟 المراجعة المحوسبة - الجزء السادس',
        description: 'تحديات متقدمة وحلول إبداعية للمسائل المعقدة',
        url: 'https://drive.google.com/file/d/1rGdc9IsoeFiQyOKN7WFo0KIXa__7RJjk/view?usp=sharing',
        type: 'computer-based',
        duration: '2 ساعة تحدٍ',
        progress: 0,
        isCompleted: false,
        order: 7
      },
      {
        id: 'verbal-computer-7',
        title: '🏆 المراجعة المحوسبة - الجزء النهائي',
        description: 'المراجعة الشاملة والاستعداد الكامل للاختبار',
        url: 'https://drive.google.com/file/d/1VD0wYWaceX-tUUBlKKCPo2ryEGBeDvnm/view?usp=sharing',
        type: 'computer-based',
        duration: '2 ساعة إنهاء',
        progress: 0,
        isCompleted: false,
        order: 8
      },
      {
        id: 'verbal-leaked-1',
        title: '🗞️ التسريب الورقي اللفظي الحصري',
        description: 'تسريب الأسئلة الورقية الحقيقية للتقييم النهائي والاستعداد الأمثل',
        url: 'https://drive.google.com/file/d/1s7a8gybNVE3s5zWE545JzpbnJXs7jQkn/view?usp=sharing',
        type: 'leaked-paper',
        duration: '1 ساعة حاسمة',
        progress: 0,
        isCompleted: false,
        order: 9
      },
    ],
    totalProgress: 0
  },
  {
    id: 'quantitative',
    title: 'القدرات الكمية 🧮',
    description: 'إتقان المهارات الرياضية والكمية من خلال برنامج تدريبي متكامل',
    type: 'quantitative',
    icon: <Calculator className="w-8 h-8" />,
    color: 'from-emerald-500 via-teal-500 to-cyan-600',
    methodology: [
      '📚 ابدأ بملفات التأسيس لفهم القوانين الأساسية',
      '🔢 اتقن المفاهيم الرياضية من خلال ملفات التأسيس',
      '💻 طبق المعرفة من خلال ملفات المراجعة المحوسبة',
      '🎯 اختبر مستواك بالتمارين المتقدمة والتطبيقات العملية'
    ],
    modules: [
      {
        id: 'quant-foundation-1',
        title: '🧠 التأسيس الكمي - الجزء الأول',
        description: 'الأسس والقوانين الرياضية الأساسية - البناء الصحيح للمعرفة',
        url: 'https://drive.google.com/file/d/1vBeR0lDF_ZhVMFadujozMz1n8iGjo3TU/view?usp=sharing',
        type: 'foundation',
        duration: '3 ساعات أساسية',
        progress: 0,
        isCompleted: false,
        order: 1
      },
      {
        id: 'quant-foundation-2',
        title: '🎯 التأسيس الكمي - الجزء الثاني',
        description: 'المفاهيم المتقدمة والتطبيقات الأساسية لتعميق الفهم',
        url: 'https://drive.google.com/file/d/1vtTXDv35SWObEtnvYUNFnw6IyYbMhL6u/view?usp=sharing',
        type: 'foundation',
        duration: '3 ساعات متقدمة',
        progress: 0,
        isCompleted: false,
        order: 2
      },
      {
        id: 'quant-foundation-3',
        title: '📚 المعاصر 10',
        description: 'المراجعة المتخصصة والتطبيقات العملية - المعاصر 10 للتأسيس الكمي المتميز',
        url: 'https://drive.google.com/file/d/1yMMOO2dA47t3ihsg4l9S2HIcPdLYyIY2/view?usp=sharing',
        type: 'foundation',
        duration: '3 ساعات متخصصة',
        progress: 0,
        isCompleted: false,
        order: 3
      },
      {
        id: 'quant-taqfeelat',
        title: '🔐 التقفيلات الكمية',
        description: 'ملف التقفيلات الحصري - أسرار وطرق متقدمة لحل الأسئلة الكمية بسرعة ودقة',
        url: '/attached_assets/taqfeelat.pdf',
        type: 'taqfeelat',
        duration: '2.5 ساعة حصرية',
        progress: 0,
        isCompleted: false,
        order: 4
      },
      // Computer-based modules (100 modules with provided links and placeholders)
      ...computerBasedUrls.map((url, index) => ({
        id: `quant-computer-${index + 1}`,
        title: `💻 المراجعة المحوسبة - الجزء ${index + 1}`,
        description: url.includes('placeholder') 
          ? `مراجعة محوسبة إضافية لتعزيز المهارات في الجزء ${index + 1}`
          : `التطبيق العملي والمراجعة المحوسبة للمفاهيم في الجزء ${index + 1}`,
        url,
        type: 'computer-based' as const,
        duration: '2 ساعات تفاعلية',
        progress: 0,
        isCompleted: false,
        order: index + 5
      }))
    ],
    totalProgress: 0
  }
];

export default function CoursesPage() {
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'verbal' | 'quantitative'>('verbal');
  const [courseProgress, setCourseProgress] = useState<{[key: string]: number}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Subscription status
  const { subscription, isLoading: subscriptionLoading, checkPremiumAccess } = useSubscription();
  const isSubscribed = subscription?.hasActiveSubscription || subscription?.isTrialActive || subscription?.canAccessPremiumFeatures;

  // Calculate section progress
  const getSectionProgress = (section: CourseSection): number => {
    const moduleIds = section.modules.map(m => m.id);
    const progresses = moduleIds.map(id => courseProgress[id] || 0);
    return progresses.length > 0 ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length) : 0;
  };

  // Filter modules based on search term
  const filteredModules = (modules: LearningModule[]) => {
    return modules.filter(m => 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get current section
  const currentSection = courseSections.find(s => s.id === activeSection);

  // Memoized filtered and sorted modules
  const sectionModules = useMemo(() => {
    if (!currentSection) return [];
    const filtered = filteredModules(currentSection.modules);
    return filtered.sort((a, b) => a.order - b.order);
  }, [currentSection, searchTerm, courseProgress]);

  const totalPages = Math.ceil(sectionModules.length / pageSize);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }

    // Load progress from localStorage
    const storedProgress = localStorage.getItem('courseProgress');
    if (storedProgress) {
      try {
        setCourseProgress(JSON.parse(storedProgress));
      } catch (error) {
        console.error("Error parsing progress:", error);
      }
    }

    // Load last active section
    const lastActiveSection = localStorage.getItem('lastActiveSection');
    if (lastActiveSection && ['verbal', 'quantitative'].includes(lastActiveSection)) {
      setActiveSection(lastActiveSection as 'verbal' | 'quantitative');
    }
  }, []);

  // Show loading while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-gray-900 dark:via-blue-900 dark:to-emerald-600 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl">
            <div className="animate-spin w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">جاري التحقق من الاشتراك...</h2>
            <p className="text-gray-600 dark:text-gray-300">يرجى الانتظار قليلاً</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Check subscription access - now we know subscription has loaded
  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-gray-900 dark:via-blue-900 dark:to-emerald-600 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto p-8"
        >
          <Card className="border-2 border-dashed border-green-400 dark:border-green-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <div className="relative inline-block">
                  <div className="p-4 bg-gradient-to-r from-green-600 to-teal-500 rounded-full">
                    <LockIcon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                      <CrownIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-600 dark:to-blue-400 bg-clip-text text-transparent mb-4">
                🔥 المسار التعليمي الحصري 🚀
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                للوصول إلى المحتوى التعليمي المتقدم والحصري، تحتاج إلى اشتراك نشط
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-r from-green-600 to-teal-500 dark:from-green-600/20 dark:to-teal-500/20 rounded-lg border border-green-400 dark:border-green-400">
                  <div className="flex items-center gap-3 mb-2">
                    <BrainIcon className="w-6 h-6 text-green-700 dark:text-green-700" />
                    <h3 className="font-bold text-green-700 dark:text-green-700">القدرات اللفظية</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">9 ملفات تفاعلية شاملة</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Calculator className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-100">القدرات الكمية</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">102 ملف تأسيسي ومحوسب</p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge className="bg-gradient-to-r from-green-600 to-teal-500 text-white px-3 py-1">
                    🏗️ التأسيس الشامل
                  </Badge>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1">
                    💻 المراجعة المحوسبة
                  </Badge>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1">
                    🗞️ التسريبات الورقية
                  </Badge>
                </div>

                <Link href="/subscription">
                  <Button 
                    className="bg-gradient-to-r from-green-600 via-blue-600 to-teal-500 hover:from-green-600 hover:via-blue-700 hover:to-teal-500 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                    data-testid="button-upgrade-subscription"
                  >
                    <DiamondIcon className="w-5 h-5 mr-2" />
                    احصل على الاشتراك المميز
                    <SparklesIcon className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const updateModuleProgress = (moduleId: string, progress: number) => {
    const newProgress = { ...courseProgress, [moduleId]: progress };
    setCourseProgress(newProgress);
    localStorage.setItem('courseProgress', JSON.stringify(newProgress));
  };

  const markModuleComplete = (moduleId: string) => {
    updateModuleProgress(moduleId, 100);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section as 'verbal' | 'quantitative');
    localStorage.setItem('lastActiveSection', section);
    setCurrentPage(1); // Reset pagination on section change
  };

  // Convert Google Drive URL to viewable format
  const convertDriveUrl = (url: string) => {
    if (url.includes('drive.google.com') && !url.includes('placeholder')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url;
  };

  // Open module in new tab
  const handleModuleClick = (module: LearningModule) => {
    if (module.url.includes('placeholder')) {
      alert('هذا الملف غير متوفر حاليًا');
      return;
    }
    const url = convertDriveUrl(module.url);
    window.open(url, '_blank', 'noopener,noreferrer');

    // Update progress automatically when opened
    if (courseProgress[module.id] === 0) {
      updateModuleProgress(module.id, 25);
    }
  };

  const getModuleTypeColor = (type: string) => {
    switch (type) {
      case 'foundation': return 'from-blue-500 to-teal-500';
      case 'computer-based': return 'from-emerald-500 to-teal-600';
      case 'leaked-paper': return 'from-orange-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case 'foundation': return <BookIcon className="w-5 h-5 text-white" />;
      case 'computer-based': return <MonitorIcon className="w-5 h-5 text-white" />;
      case 'leaked-paper': return <FileTextIcon className="w-5 h-5 text-white" />;
      default: return <StarIcon className="w-5 h-5 text-white" />;
    }
  };

  // Paginate modules
  const paginatedModules = (modules: LearningModule[]) => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return modules.slice(start, end);
  };

  // Main courses interface for subscribed users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-gray-900 dark:via-blue-900 dark:to-emerald-600">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section - Luxury & Professional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20 max-w-6xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 via-teal-600/60 to-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
            {/* Elegant Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-green-600/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-600/10 via-green-500/5 to-transparent rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 p-12 md:p-16">
              {/* Title Section */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center gap-4 mb-6">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-emerald-600/20 rounded-2xl backdrop-blur-sm border border-white/10">
                    <GraduationCapIcon className="w-7 h-7 text-blue-300" />
                  </div>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent via-green-600 to-transparent" />
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-l from-blue-200 via-white to-emerald-600 bg-clip-text text-transparent tracking-tight">
                  المسار التعليمي الحصري
                </h1>

                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
                  منهجية علمية متطورة ومدروسة للإعداد الشامل والاحترافي لاختبار القدرات
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:bg-white/10 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
                  <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl">
                      <ShieldIcon className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">منهجية مدروسة</h3>
                      <p className="text-slate-400 text-sm">خطة تعليمية احترافية ومتكاملة</p>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:bg-white/10 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/10 rounded-full blur-2xl group-hover:bg-green-100/20 transition-all duration-500" />
                  <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl">
                      <ZapIcon className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">تتبع ذكي للتقدم</h3>
                      <p className="text-slate-400 text-sm">قياس دقيق لمستواك وتطورك</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Course Sections */}
        <Tabs value={activeSection} onValueChange={handleSectionChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-900/40 backdrop-blur-lg rounded-2xl p-2 border border-white/10">
            {courseSections.map((section) => {
              const sectionProgress = getSectionProgress(section);
              return (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg py-3 rounded-xl transition-all duration-300 text-slate-400 hover:text-white hover:bg-white/5"
                data-testid={`tab-${section.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gradient-to-br ${section.color} rounded-lg`}>
                    {React.cloneElement(section.icon as React.ReactElement, { className: 'w-5 h-5' })}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{section.title}</div>
                    {sectionProgress > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-white/10 rounded-full h-1 overflow-hidden w-20">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-emerald-600 h-1 rounded-full transition-all duration-500" 
                            style={{ width: `${sectionProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-blue-300">{sectionProgress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsTrigger>
              );
            })}
          </TabsList>

          {courseSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Input
                      placeholder="ابحث عن درس أو وصف..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 bg-white/5 backdrop-blur-sm border-white/10"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Learning Modules */}
                <div className="space-y-6">
                  {/* Foundation Modules */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl shadow-lg">
                        <BookIcon className="w-5 h-5 text-white" />
                      </div>
                      <span>مرحلة التأسيس</span>
                      <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-normal">أساسي</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {paginatedModules(filteredModules(section.modules.filter(m => m.type === 'foundation'))).map((module, index) => (
                        <motion.div
                          key={module.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer bg-slate-900/30 backdrop-blur-sm border border-white/10 hover:border-blue-500/30">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 bg-gradient-to-r ${getModuleTypeColor(module.type)} rounded-lg`}>
                                    {getModuleTypeIcon(module.type)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                      {module.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{module.duration}</p>
                                  </div>
                                </div>
                                {courseProgress[module.id] === 100 && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", duration: 0.5 }}
                                  >
                                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                  </motion.div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                {module.description}
                              </p>
                              {courseProgress[module.id] > 0 && (
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>التقدم</span>
                                    <span>{courseProgress[module.id]}%</span>
                                  </div>
                                  <Progress value={courseProgress[module.id]} className="h-2" />
                                </div>
                              )}
                              <Button
                                onClick={() => handleModuleClick(module)}
                                className={`w-full bg-gradient-to-r ${getModuleTypeColor(module.type)} hover:opacity-90 text-white`}
                                data-testid={`button-start-module-${module.id}`}
                                disabled={module.url.includes('placeholder')}
                              >
                                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                                {courseProgress[module.id] > 0 ? 'متابعة' : 'بدء'} الدرس
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Computer-based Modules */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                        <MonitorIcon className="w-5 h-5 text-white" />
                      </div>
                      المراجعة المحوسبة 💻
                      <Badge className="bg-emerald-500 text-white">تطبيقي</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {paginatedModules(filteredModules(section.modules.filter(m => m.type === 'computer-based'))).map((module, index) => (
                        <motion.div
                          key={module.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -5 }}
                        >
                          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 bg-gradient-to-r ${getModuleTypeColor(module.type)} rounded-lg`}>
                                    {getModuleTypeIcon(module.type)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                      {module.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{module.duration}</p>
                                  </div>
                                </div>
                                {courseProgress[module.id] === 100 && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", duration: 0.5 }}
                                  >
                                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                  </motion.div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                {module.description}
                              </p>
                              {courseProgress[module.id] > 0 && (
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>التقدم</span>
                                    <span>{courseProgress[module.id]}%</span>
                                  </div>
                                  <Progress value={courseProgress[module.id]} className="h-2" />
                                </div>
                              )}
                              <Button
                                onClick={() => handleModuleClick(module)}
                                className={`w-full bg-gradient-to-r ${getModuleTypeColor(module.type)} hover:opacity-90 text-white`}
                                data-testid={`button-start-module-${module.id}`}
                                disabled={module.url.includes('placeholder')}
                              >
                                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                                {courseProgress[module.id] > 0 ? 'متابعة' : 'بدء'} المراجعة
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    {/* Pagination */}
                    {section.id === 'quantitative' && totalPages > 1 && (
                      <Pagination className="justify-center mt-8">
                        <PaginationContent className="flex-wrap gap-1">
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                              }}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          {/* Smart pagination - show limited pages based on screen size */}
                          {(() => {
                            const pages: (number | string)[] = [];
                            const maxVisiblePages = window.innerWidth < 640 ? 3 : window.innerWidth < 1024 ? 5 : 7;
                            
                            if (totalPages <= maxVisiblePages + 2) {
                              // Show all pages if total is small
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              // Always show first page
                              pages.push(1);
                              
                              const leftSiblings = Math.floor((maxVisiblePages - 1) / 2);
                              const rightSiblings = Math.floor((maxVisiblePages - 1) / 2);
                              
                              let start = Math.max(2, currentPage - leftSiblings);
                              let end = Math.min(totalPages - 1, currentPage + rightSiblings);
                              
                              // Adjust if we're near the start
                              if (currentPage <= leftSiblings + 2) {
                                end = Math.min(totalPages - 1, maxVisiblePages);
                              }
                              
                              // Adjust if we're near the end
                              if (currentPage >= totalPages - rightSiblings - 1) {
                                start = Math.max(2, totalPages - maxVisiblePages);
                              }
                              
                              // Add ellipsis if needed
                              if (start > 2) {
                                pages.push('...');
                              }
                              
                              // Add middle pages
                              for (let i = start; i <= end; i++) {
                                pages.push(i);
                              }
                              
                              // Add ellipsis if needed
                              if (end < totalPages - 1) {
                                pages.push('...');
                              }
                              
                              // Always show last page
                              pages.push(totalPages);
                            }
                            
                            return pages.map((page, idx) => (
                              <PaginationItem key={`page-${idx}`}>
                                {typeof page === 'number' ? (
                                  <PaginationLink 
                                    href="#"
                                    isActive={currentPage === page}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentPage(page);
                                    }}
                                    className="min-w-[2.5rem]"
                                  >
                                    {page}
                                  </PaginationLink>
                                ) : (
                                  <span className="px-2 text-gray-400 dark:text-gray-500">
                                    {page}
                                  </span>
                                )}
                              </PaginationItem>
                            ));
                          })()}
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                              }}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>

                  {/* Leaked Paper Modules */}
                  {filteredModules(section.modules.filter(m => m.type === 'leaked-paper')).length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                          <FileTextIcon className="w-5 h-5 text-white" />
                        </div>
                        التسريبات الورقية 🗞️
                        <Badge className="bg-orange-500 text-white">تقييمي</Badge>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedModules(filteredModules(section.modules.filter(m => m.type === 'leaked-paper'))).map((module, index) => (
                          <motion.div
                            key={module.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.2 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-orange-200 dark:border-orange-700 hover:border-orange-400 dark:hover:border-orange-500">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 bg-gradient-to-r ${getModuleTypeColor(module.type)} rounded-lg`}>
                                      {getModuleTypeIcon(module.type)}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                                        {module.title}
                                      </h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">{module.duration}</p>
                                    </div>
                                  </div>
                                  {courseProgress[module.id] === 100 && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", duration: 0.5 }}
                                    >
                                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                    </motion.div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                  {module.description}
                                </p>
                                {courseProgress[module.id] > 0 && (
                                  <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>التقدم</span>
                                      <span>{courseProgress[module.id]}%</span>
                                    </div>
                                    <Progress value={courseProgress[module.id]} className="h-2" />
                                  </div>
                                )}
                                <Button
                                  onClick={() => handleModuleClick(module)}
                                  className={`w-full bg-gradient-to-r ${getModuleTypeColor(module.type)} hover:opacity-90 text-white`}
                                  data-testid={`button-start-module-${module.id}`}
                                  disabled={module.url.includes('placeholder')}
                                >
                                  <ExternalLinkIcon className="w-4 h-4 mr-2" />
                                  {courseProgress[module.id] > 0 ? 'متابعة' : 'بدء'} التسريب
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  Coffee,
  Target,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PomodoroTimerProps {
  userId: number;
  tasks: any[];
}

export const PomodoroTimer = ({ userId, tasks }: PomodoroTimerProps) => {
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<"work" | "short_break" | "long_break">("work");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/pomodoro-sessions`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pomodoro-sessions", userId] });
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1);
      }, 1000);
    } else if (time === 0) {
      handleSessionComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time]);

  const handleSessionComplete = () => {
    setIsActive(false);
    
    // Log the completed session
    createSessionMutation.mutate({
      userId,
      taskId: selectedTaskId,
      duration: getSessionDuration(sessionType),
      type: sessionType,
      startedAt: new Date(),
      completedAt: new Date(),
      wasCompleted: true
    });

    // Show notification and auto-switch to break
    if (sessionType === "work") {
      setSessionCount(prev => prev + 1);
      const nextType = sessionCount > 0 && (sessionCount + 1) % 4 === 0 ? "long_break" : "short_break";
      setSessionType(nextType);
      setTime(getSessionDuration(nextType));
      
      toast({
        title: "انتهت فترة العمل!",
        description: `حان وقت ${nextType === "long_break" ? "الاستراحة الطويلة" : "الاستراحة القصيرة"}`,
      });
    } else {
      setSessionType("work");
      setTime(getSessionDuration("work"));
      
      toast({
        title: "انتهت الاستراحة!",
        description: "حان وقت العودة للعمل",
      });
    }
  };

  const getSessionDuration = (type: "work" | "short_break" | "long_break") => {
    switch (type) {
      case "work": return 25 * 60;
      case "short_break": return 5 * 60;
      case "long_break": return 15 * 60;
    }
  };

  const getSessionLabel = (type: "work" | "short_break" | "long_break") => {
    switch (type) {
      case "work": return "فترة عمل";
      case "short_break": return "استراحة قصيرة";
      case "long_break": return "استراحة طويلة";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isActive) {
      // Starting a new session
      createSessionMutation.mutate({
        userId,
        taskId: selectedTaskId,
        duration: getSessionDuration(sessionType),
        type: sessionType,
        startedAt: new Date(),
        wasCompleted: false
      });
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime(getSessionDuration(sessionType));
  };

  const switchSessionType = (type: "work" | "short_break" | "long_break") => {
    setSessionType(type);
    setTime(getSessionDuration(type));
    setIsActive(false);
  };

  const progress = ((getSessionDuration(sessionType) - time) / getSessionDuration(sessionType)) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">مؤقت بومودورو</h2>
        <p className="text-gray-600 dark:text-gray-400">
          اعمل بتركيز عالي لفترات قصيرة مع استراحات منتظمة
        </p>
      </div>

      {/* Main Timer Card */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Timer className="w-6 h-6" />
            {getSessionLabel(sessionType)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Circular Progress */}
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${progress * 2.83} ${(100 - progress) * 2.83}`}
                className={sessionType === "work" ? "text-blue-500" : "text-green-500"}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold">{formatTime(time)}</div>
                <div className="text-sm text-gray-500">
                  الجلسة {sessionCount + 1}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleTimer}
              size="lg"
              className={`gap-2 ${
                sessionType === "work" 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5" />
                  إيقاف مؤقت
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  ابدأ
                </>
              )}
            </Button>
            
            <Button onClick={resetTimer} variant="outline" size="lg" className="gap-2">
              <RotateCcw className="w-5 h-5" />
              إعادة تعيين
            </Button>
          </div>

          {/* Session Type Selector */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={sessionType === "work" ? "default" : "outline"}
              size="sm"
              onClick={() => switchSessionType("work")}
              disabled={isActive}
            >
              <Target className="w-4 h-4 mr-1" />
              عمل (25 د)
            </Button>
            <Button
              variant={sessionType === "short_break" ? "default" : "outline"}
              size="sm"
              onClick={() => switchSessionType("short_break")}
              disabled={isActive}
            >
              <Coffee className="w-4 h-4 mr-1" />
              استراحة (5 د)
            </Button>
            <Button
              variant={sessionType === "long_break" ? "default" : "outline"}
              size="sm"
              onClick={() => switchSessionType("long_break")}
              disabled={isActive}
            >
              <Coffee className="w-4 h-4 mr-1" />
              استراحة طويلة (15 د)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Selection */}
      <Card>
        <CardHeader>
          <CardTitle>ربط المهمة (اختياري)</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedTaskId?.toString() || ""} 
            onValueChange={(value) => setSelectedTaskId(value ? parseInt(value) : null)}
            disabled={isActive}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر مهمة للعمل عليها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">بدون مهمة محددة</SelectItem>
              {tasks
                .filter((task: any) => task.status !== "completed")
                .map((task: any) => (
                  <SelectItem key={task.id} value={task.id.toString()}>
                    {task.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            إحصائيات اليوم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sessionCount}</div>
              <div className="text-sm text-gray-500">جلسات مكتملة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sessionCount * 25}</div>
              <div className="text-sm text-gray-500">دقائق تركيز</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-500">مهام منجزة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.floor(sessionCount / 4)}
              </div>
              <div className="text-sm text-gray-500">دورات كاملة</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>نصائح بومودورو</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• اعمل لمدة 25 دقيقة بتركيز كامل</li>
            <li>• خذ استراحة 5 دقائق بين كل جلسة</li>
            <li>• بعد 4 جلسات، خذ استراحة طويلة 15-30 دقيقة</li>
            <li>• أغلق جميع المشتتات أثناء فترة العمل</li>
            <li>• استخدم الاستراحات للحركة وإراحة العينين</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
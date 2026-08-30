import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  Bell,
  Clock,
  Target,
  Palette,
  Globe,
  Volume2,
  Calendar,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Wifi
} from "lucide-react";
import { timeStorage, UserSettings } from "@/lib/timeStorage";

interface SettingsAndBackupProps {
  userId: number;
}

export const SettingsAndBackup = ({ userId }: SettingsAndBackupProps) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'creating' | 'restoring' | 'success' | 'error'>('idle');
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    calculateStorageInfo();
    
    // تحقق من النسخ الاحتياطي التلقائي
    const autoBackup = localStorage.getItem('auto_backup_enabled');
    setIsAutoBackupEnabled(autoBackup === 'true');
    
    // إعداد النسخ الاحتياطي التلقائي
    if (autoBackup === 'true') {
      setupAutoBackup();
    }
  }, []);

  const loadSettings = () => {
    const userSettings = timeStorage.getSettings();
    setSettings(userSettings);
  };

  const saveSettings = (newSettings: UserSettings) => {
    timeStorage.saveSettings(newSettings);
    setSettings(newSettings);
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم تحديث إعداداتك بنجاح"
    });
  };

  const calculateStorageInfo = () => {
    const tasks = timeStorage.getTasks();
    const habits = timeStorage.getHabits();
    const habitLogs = timeStorage.getHabitLogs();
    const projects = timeStorage.getProjects();
    const pomodoroSessions = timeStorage.getPomodoroSessions();
    
    const totalItems = tasks.length + habits.length + habitLogs.length + projects.length + pomodoroSessions.length;
    
    // تقدير حجم البيانات (تقريبي)
    const estimatedSize = (JSON.stringify({
      tasks, habits, habitLogs, projects, pomodoroSessions
    }).length / 1024).toFixed(2); // بالكيلوبايت

    setStorageInfo({
      totalItems,
      estimatedSize,
      tasks: tasks.length,
      habits: habits.length,
      habitLogs: habitLogs.length,
      projects: projects.length,
      pomodoroSessions: pomodoroSessions.length,
      lastBackup: localStorage.getItem('last_backup_date')
    });
  };

  const createBackup = async () => {
    setBackupStatus('creating');
    try {
      const backupData = timeStorage.createBackup();
      
      // إنشاء ملف للتحميل
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `وقتي-نسخة-احتياطية-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // تحديث تاريخ آخر نسخة احتياطية
      localStorage.setItem('last_backup_date', new Date().toISOString());
      
      setBackupStatus('success');
      calculateStorageInfo();
      
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم تحميل ملف النسخة الاحتياطية بنجاح"
      });
      
      setTimeout(() => setBackupStatus('idle'), 3000);
    } catch (error) {
      setBackupStatus('error');
      toast({
        title: "خطأ في النسخة الاحتياطية",
        description: "حدث خطأ أثناء إنشاء النسخة الاحتياطية"
      });
      setTimeout(() => setBackupStatus('idle'), 3000);
    }
  };

  const handleFileRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBackupStatus('restoring');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backupString = e.target?.result as string;
        const success = timeStorage.restoreFromBackup(backupString);
        
        if (success) {
          setBackupStatus('success');
          calculateStorageInfo();
          loadSettings();
          
          toast({
            title: "تم استرجاع البيانات",
            description: "تم استرجاع بياناتك من النسخة الاحتياطية بنجاح"
          });
          
          // إعادة تحميل الصفحة لتطبيق التغييرات
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          throw new Error('Invalid backup file');
        }
      } catch (error) {
        setBackupStatus('error');
        toast({
          title: "خطأ في الاستراجع",
          description: "ملف النسخة الاحتياطية غير صالح أو تالف"
        });
      }
      
      setTimeout(() => setBackupStatus('idle'), 3000);
    };
    
    reader.readAsText(file);
    event.target.value = ''; // إعادة تعيين المدخل
  };

  const clearAllData = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
      // حذف جميع البيانات
      localStorage.removeItem('time_management_tasks');
      localStorage.removeItem('time_management_habits');
      localStorage.removeItem('time_management_habit_logs');
      localStorage.removeItem('time_management_projects');
      localStorage.removeItem('time_management_pomodoro_sessions');
      localStorage.removeItem('time_management_analytics');
      localStorage.removeItem('smart_goals');
      
      toast({
        title: "تم حذف البيانات",
        description: "تم حذف جميع بياناتك بنجاح"
      });
      
      // إعادة تحميل الصفحة
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const setupAutoBackup = () => {
    // نسخة احتياطية أسبوعية تلقائية
    const lastAutoBackup = localStorage.getItem('last_auto_backup');
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    if (!lastAutoBackup || (now.getTime() - new Date(lastAutoBackup).getTime() > oneWeek)) {
      timeStorage.createBackup();
      localStorage.setItem('last_auto_backup', now.toISOString());
    }
  };

  const toggleAutoBackup = (enabled: boolean) => {
    setIsAutoBackupEnabled(enabled);
    localStorage.setItem('auto_backup_enabled', enabled.toString());
    
    if (enabled) {
      setupAutoBackup();
      toast({
        title: "تم تفعيل النسخ التلقائي",
        description: "سيتم إنشاء نسخة احتياطية كل أسبوع تلقائياً"
      });
    }
  };

  if (!settings) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">الإعدادات والنسخ الاحتياطي</h2>
          <p className="text-gray-600 dark:text-gray-400">
            تخصيص النظام وإدارة بياناتك
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="productivity">الإنتاجية</TabsTrigger>
          <TabsTrigger value="backup">النسخ الاحتياطي</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                الإعدادات العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    المظهر
                  </Label>
                  <Select 
                    value={settings.theme} 
                    onValueChange={(value) => saveSettings({...settings, theme: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">فاتح</SelectItem>
                      <SelectItem value="dark">داكن</SelectItem>
                      <SelectItem value="auto">تلقائي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    اللغة
                  </Label>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => saveSettings({...settings, language: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  أهداف الإنتاجية
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>المهام اليومية المستهدفة</Label>
                    <Input
                      type="number"
                      value={settings.goals.dailyTaskTarget}
                      onChange={(e) => saveSettings({
                        ...settings,
                        goals: {...settings.goals, dailyTaskTarget: parseInt(e.target.value) || 5}
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>الساعات الأسبوعية المستهدفة</Label>
                    <Input
                      type="number"
                      value={settings.goals.weeklyHoursTarget}
                      onChange={(e) => saveSettings({
                        ...settings,
                        goals: {...settings.goals, weeklyHoursTarget: parseInt(e.target.value) || 40}
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>المشاريع الشهرية المستهدفة</Label>
                    <Input
                      type="number"
                      value={settings.goals.monthlyProjectsTarget}
                      onChange={(e) => saveSettings({
                        ...settings,
                        goals: {...settings.goals, monthlyProjectsTarget: parseInt(e.target.value) || 2}
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل الإشعارات</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      تلقي إشعارات عامة من النظام
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.enabled}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      notifications: {...settings.notifications, enabled: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <div>
                      <Label>الأصوات</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        تشغيل أصوات مع الإشعارات
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.sound}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      notifications: {...settings.notifications, sound: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تذكير المهام</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      إشعارات عند اقتراب مواعيد المهام
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.taskReminders}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      notifications: {...settings.notifications, taskReminders: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تذكير العادات</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      إشعارات يومية للعادات
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.habitReminders}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      notifications: {...settings.notifications, habitReminders: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>فترات البومودورو</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      إشعارات بداية ونهاية فترات العمل
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pomodoroBreaks}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      notifications: {...settings.notifications, pomodoroBreaks: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>التقارير الأسبوعية</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ملخص أسبوعي للإنجازات
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyReports}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      notifications: {...settings.notifications, weeklyReports: checked}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                إعدادات البومودورو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>فترة العمل (دقيقة)</Label>
                  <Input
                    type="number"
                    value={settings.pomodoro.workDuration}
                    onChange={(e) => saveSettings({
                      ...settings,
                      pomodoro: {...settings.pomodoro, workDuration: parseInt(e.target.value) || 25}
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الاستراحة القصيرة (دقيقة)</Label>
                  <Input
                    type="number"
                    value={settings.pomodoro.shortBreak}
                    onChange={(e) => saveSettings({
                      ...settings,
                      pomodoro: {...settings.pomodoro, shortBreak: parseInt(e.target.value) || 5}
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الاستراحة الطويلة (دقيقة)</Label>
                  <Input
                    type="number"
                    value={settings.pomodoro.longBreak}
                    onChange={(e) => saveSettings({
                      ...settings,
                      pomodoro: {...settings.pomodoro, longBreak: parseInt(e.target.value) || 15}
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>عدد الجلسات قبل الاستراحة الطويلة</Label>
                  <Input
                    type="number"
                    value={settings.pomodoro.sessionsUntilLongBreak}
                    onChange={(e) => saveSettings({
                      ...settings,
                      pomodoro: {...settings.pomodoro, sessionsUntilLongBreak: parseInt(e.target.value) || 4}
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>بدء الاستراحات تلقائياً</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      بدء فترات الاستراحة بدون تدخل
                    </p>
                  </div>
                  <Switch
                    checked={settings.pomodoro.autoStartBreaks}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      pomodoro: {...settings.pomodoro, autoStartBreaks: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>بدء جلسات العمل تلقائياً</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      بدء جلسات العمل بعد الاستراحة مباشرة
                    </p>
                  </div>
                  <Switch
                    checked={settings.pomodoro.autoStartPomodoros}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      pomodoro: {...settings.pomodoro, autoStartPomodoros: checked}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                أوقات العمل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>بداية يوم العمل</Label>
                  <Input
                    type="time"
                    value={settings.productivity.workingHours.start}
                    onChange={(e) => saveSettings({
                      ...settings,
                      productivity: {
                        ...settings.productivity,
                        workingHours: {...settings.productivity.workingHours, start: e.target.value}
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>نهاية يوم العمل</Label>
                  <Input
                    type="time"
                    value={settings.productivity.workingHours.end}
                    onChange={(e) => saveSettings({
                      ...settings,
                      productivity: {
                        ...settings.productivity,
                        workingHours: {...settings.productivity.workingHours, end: e.target.value}
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          {/* معلومات التخزين */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                معلومات التخزين
              </CardTitle>
            </CardHeader>
            <CardContent>
              {storageInfo && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">إجمالي العناصر</span>
                      <Badge variant="secondary">{storageInfo.totalItems}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">حجم البيانات التقريبي</span>
                      <Badge variant="secondary">{storageInfo.estimatedSize} كيلوبايت</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">آخر نسخة احتياطية</span>
                      <Badge variant="outline">
                        {storageInfo.lastBackup 
                          ? new Date(storageInfo.lastBackup).toLocaleDateString('ar-SA')
                          : 'لا توجد'
                        }
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">تفاصيل البيانات</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>المهام</span>
                        <span>{storageInfo.tasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>العادات</span>
                        <span>{storageInfo.habits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>سجلات العادات</span>
                        <span>{storageInfo.habitLogs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المشاريع</span>
                        <span>{storageInfo.projects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>جلسات البومودورو</span>
                        <span>{storageInfo.pomodoroSessions}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* النسخ الاحتياطي */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                النسخ الاحتياطي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>النسخ التلقائي</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    إنشاء نسخة احتياطية تلقائياً كل أسبوع
                  </p>
                </div>
                <Switch
                  checked={isAutoBackupEnabled}
                  onCheckedChange={toggleAutoBackup}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  onClick={createBackup}
                  disabled={backupStatus === 'creating'}
                  className="w-full"
                >
                  {backupStatus === 'creating' && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {backupStatus === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
                  {backupStatus === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
                  {backupStatus === 'idle' && <Download className="w-4 h-4 mr-2" />}
                  
                  {backupStatus === 'creating' ? 'جاري الإنشاء...' :
                   backupStatus === 'success' ? 'تم بنجاح!' :
                   backupStatus === 'error' ? 'حدث خطأ!' :
                   'إنشاء نسخة احتياطية'}
                </Button>

                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={backupStatus === 'restoring'}
                  >
                    {backupStatus === 'restoring' && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    {backupStatus !== 'restoring' && <Upload className="w-4 h-4 mr-2" />}
                    
                    {backupStatus === 'restoring' ? 'جاري الاستراجع...' : 'استراجع نسخة احتياطية'}
                  </Button>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={backupStatus === 'restoring'}
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    نصائح مهمة
                  </span>
                </div>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• قم بإنشاء نسخة احتياطية قبل أي تغييرات كبيرة</li>
                  <li>• احتفظ بنسخ احتياطية في مكان آمن</li>
                  <li>• تحقق من صحة النسخة الاحتياطية بشكل دوري</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* خيارات متقدمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                خيارات متقدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  منطقة الخطر
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  هذه الإجراءات لا يمكن التراجع عنها. تأكد من إنشاء نسخة احتياطية أولاً.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      timeStorage.cleanupOldData(30);
                      calculateStorageInfo();
                      toast({
                        title: "تم تنظيف البيانات",
                        description: "تم حذف البيانات الأقدم من 30 يوم"
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    تنظيف البيانات القديمة (30+ يوم)
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={clearAllData}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    حذف جميع البيانات
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
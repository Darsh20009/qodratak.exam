import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target, 
  Plus, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Flame,
  Trophy,
  Edit,
  Trash2
} from "lucide-react";
import { timeStorage } from "@/lib/timeStorage";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: Date;
  createdAt: Date;
  completedAt?: Date;
  milestones: Milestone[];
  tags: string[];
  reward?: string;
  motivation: string;
}

interface Milestone {
  id: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedAt?: Date;
}

interface SmartGoalsProps {
  userId: number;
}

export const SmartGoals = ({ userId }: SmartGoalsProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    category: 'weekly',
    priority: 'medium',
    targetValue: 1,
    currentValue: 0,
    unit: 'مرة',
    motivation: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = () => {
    // في التطبيق الحقيقي، سنحمل الأهداف من التخزين المحلي
    const savedGoals = localStorage.getItem('smart_goals');
    if (savedGoals) {
      const parsed = JSON.parse(savedGoals).map((goal: any) => ({
        ...goal,
        createdAt: new Date(goal.createdAt),
        deadline: goal.deadline ? new Date(goal.deadline) : undefined,
        completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined
      }));
      setGoals(parsed);
    } else {
      // أهداف افتراضية للعرض
      const defaultGoals: Goal[] = [
        {
          id: '1',
          title: 'قراءة 20 كتاب هذا العام',
          description: 'هدف تطوير الذات من خلال القراءة المستمرة',
          category: 'yearly',
          priority: 'high',
          status: 'in_progress',
          targetValue: 20,
          currentValue: 7,
          unit: 'كتاب',
          deadline: new Date(2025, 11, 31),
          createdAt: new Date(2025, 0, 1),
          milestones: [
            { id: '1', title: 'الربع الأول', targetValue: 5, completed: true, completedAt: new Date(2025, 2, 31) },
            { id: '2', title: 'الربع الثاني', targetValue: 10, completed: false },
            { id: '3', title: 'الربع الثالث', targetValue: 15, completed: false },
            { id: '4', title: 'الربع الرابع', targetValue: 20, completed: false }
          ],
          tags: ['تطوير', 'معرفة', 'ثقافة'],
          reward: 'شراء كتاب خاص من مؤلف مفضل',
          motivation: 'توسيع المعرفة وتطوير الشخصية'
        },
        {
          id: '2',
          title: 'ممارسة الرياضة 4 مرات أسبوعياً',
          description: 'الحفاظ على اللياقة البدنية والصحة العامة',
          category: 'weekly',
          priority: 'high',
          status: 'in_progress',
          targetValue: 4,
          currentValue: 2,
          unit: 'جلسة',
          createdAt: new Date(2025, 5, 1),
          milestones: [
            { id: '1', title: 'الأسبوع الأول', targetValue: 4, completed: false },
            { id: '2', title: 'الأسبوع الثاني', targetValue: 4, completed: false }
          ],
          tags: ['صحة', 'لياقة', 'رياضة'],
          motivation: 'الحفاظ على صحة جيدة وطاقة عالية'
        },
        {
          id: '3',
          title: 'تعلم 100 كلمة إنجليزية جديدة',
          description: 'تحسين مستوى اللغة الإنجليزية',
          category: 'monthly',
          priority: 'medium',
          status: 'in_progress',
          targetValue: 100,
          currentValue: 32,
          unit: 'كلمة',
          deadline: new Date(2025, 6, 31),
          createdAt: new Date(2025, 5, 1),
          milestones: [
            { id: '1', title: 'الأسبوع الأول', targetValue: 25, completed: true },
            { id: '2', title: 'الأسبوع الثاني', targetValue: 50, completed: false },
            { id: '3', title: 'الأسبوع الثالث', targetValue: 75, completed: false },
            { id: '4', title: 'الأسبوع الرابع', targetValue: 100, completed: false }
          ],
          tags: ['تعلم', 'لغة', 'تطوير'],
          motivation: 'فتح فرص جديدة في العمل والحياة'
        }
      ];
      setGoals(defaultGoals);
      localStorage.setItem('smart_goals', JSON.stringify(defaultGoals));
    }
  };

  const saveGoals = (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem('smart_goals', JSON.stringify(updatedGoals));
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.description) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category as any,
      priority: newGoal.priority as any,
      status: 'not_started',
      targetValue: newGoal.targetValue || 1,
      currentValue: 0,
      unit: newGoal.unit || 'مرة',
      deadline: newGoal.deadline,
      createdAt: new Date(),
      milestones: generateMilestones(newGoal.targetValue || 1, newGoal.category as any),
      tags: [],
      motivation: newGoal.motivation || ''
    };

    const updatedGoals = [...goals, goal];
    saveGoals(updatedGoals);
    setNewGoal({
      title: '',
      description: '',
      category: 'weekly',
      priority: 'medium',
      targetValue: 1,
      currentValue: 0,
      unit: 'مرة',
      motivation: ''
    });
    setIsAddingGoal(false);
  };

  const generateMilestones = (targetValue: number, category: string): Milestone[] => {
    const milestones: Milestone[] = [];
    let milestoneCount = 4;
    
    if (category === 'daily') milestoneCount = 1;
    else if (category === 'weekly') milestoneCount = 2;
    else if (category === 'monthly') milestoneCount = 4;
    else if (category === 'yearly') milestoneCount = 4;

    for (let i = 1; i <= milestoneCount; i++) {
      milestones.push({
        id: i.toString(),
        title: `المرحلة ${i}`,
        targetValue: Math.round((targetValue / milestoneCount) * i),
        completed: false
      });
    }

    return milestones;
  };

  const updateGoalProgress = (goalId: string, newValue: number) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const updatedGoal = { ...goal, currentValue: newValue };
        
        // تحديث الأهداف الفرعية
        updatedGoal.milestones = updatedGoal.milestones.map(milestone => ({
          ...milestone,
          completed: newValue >= milestone.targetValue,
          completedAt: newValue >= milestone.targetValue && !milestone.completed ? new Date() : milestone.completedAt
        }));

        // تحديث حالة الهدف
        if (newValue >= goal.targetValue) {
          updatedGoal.status = 'completed';
          updatedGoal.completedAt = new Date();
        } else if (newValue > 0) {
          updatedGoal.status = 'in_progress';
        }

        return updatedGoal;
      }
      return goal;
    });

    saveGoals(updatedGoals);
  };

  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    saveGoals(updatedGoals);
  };

  const filteredGoals = selectedCategory === 'all' 
    ? goals 
    : goals.filter(goal => goal.category === selectedCategory);

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      'daily': 'يومي',
      'weekly': 'أسبوعي',
      'monthly': 'شهري',
      'yearly': 'سنوي',
      'lifetime': 'مدى الحياة'
    };
    return names[category] || category;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'paused': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
  const totalProgress = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">الأهداف الذكية</h2>
          <p className="text-gray-600 dark:text-gray-400">
            خطط وتتبع أهدافك بطريقة ذكية وفعالة
          </p>
        </div>
        
        <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              هدف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة هدف جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">عنوان الهدف</label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="مثال: قراءة 10 كتب"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">الوصف</label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="وصف مفصل للهدف..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">الفئة</label>
                  <Select value={newGoal.category} onValueChange={(value) => setNewGoal({...newGoal, category: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="yearly">سنوي</SelectItem>
                      <SelectItem value="lifetime">مدى الحياة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">الأولوية</label>
                  <Select value={newGoal.priority} onValueChange={(value) => setNewGoal({...newGoal, priority: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="critical">حرجة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">القيمة المستهدفة</label>
                  <Input
                    type="number"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({...newGoal, targetValue: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">الوحدة</label>
                  <Input
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                    placeholder="كتاب، ساعة، مرة..."
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">الدافع</label>
                <Textarea
                  value={newGoal.motivation}
                  onChange={(e) => setNewGoal({...newGoal, motivation: e.target.value})}
                  placeholder="لماذا هذا الهدف مهم بالنسبة لك؟"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddGoal} className="flex-1">
                  إضافة الهدف
                </Button>
                <Button variant="outline" onClick={() => setIsAddingGoal(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأهداف</p>
                <p className="text-2xl font-bold">{goals.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مكتملة</p>
                <p className="text-2xl font-bold text-green-600">{completedGoals}</p>
              </div>
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressGoals}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">معدل الإنجاز</p>
                <p className="text-2xl font-bold text-green-600">{totalProgress.toFixed(0)}%</p>
              </div>
              <Star className="w-8 h-8 text-green-500" />
            </div>
            <Progress value={totalProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* فلاتر */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          الكل ({goals.length})
        </Button>
        {['daily', 'weekly', 'monthly', 'yearly', 'lifetime'].map(category => {
          const count = goals.filter(g => g.category === category).length;
          if (count === 0) return null;
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryName(category)} ({count})
            </Button>
          );
        })}
      </div>

      {/* قائمة الأهداف */}
      <div className="grid gap-4">
        {filteredGoals.map(goal => (
          <Card key={goal.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(goal.status)}
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <Badge variant="secondary" className={getPriorityColor(goal.priority)}>
                      {goal.priority === 'low' ? 'منخفضة' : 
                       goal.priority === 'medium' ? 'متوسطة' :
                       goal.priority === 'high' ? 'عالية' : 'حرجة'}
                    </Badge>
                    <Badge variant="outline">
                      {getCategoryName(goal.category)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {goal.description}
                  </p>
                  {goal.motivation && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                      💡 {goal.motivation}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* التقدم الإجمالي */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">التقدم الإجمالي</span>
                  <span className="text-sm text-gray-600">
                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </span>
                </div>
                <Progress value={(goal.currentValue / goal.targetValue) * 100} className="h-2" />
                
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateGoalProgress(goal.id, Math.max(0, goal.currentValue - 1))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={goal.currentValue}
                    onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateGoalProgress(goal.id, Math.min(goal.targetValue, goal.currentValue + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* المراحل الفرعية */}
              {goal.milestones.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">المراحل الفرعية</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {goal.milestones.map(milestone => (
                      <div
                        key={milestone.id}
                        className={`p-2 rounded-lg border ${
                          milestone.completed 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {milestone.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className="text-sm font-medium">{milestone.title}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {milestone.targetValue} {goal.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* المكافأة */}
              {goal.reward && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      المكافأة عند الإنجاز
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {goal.reward}
                  </p>
                </div>
              )}

              {/* تاريخ الانتهاء */}
              {goal.deadline && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    الموعد النهائي: {goal.deadline.toLocaleDateString('ar-SA')}
                  </span>
                  {goal.deadline < new Date() && goal.status !== 'completed' && (
                    <Badge variant="destructive" className="text-xs">
                      متأخر
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGoals.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد أهداف</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ابدأ بإضافة هدف جديد لتتبع تقدمك
            </p>
            <Button onClick={() => setIsAddingGoal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة هدف جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
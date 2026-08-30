// نظام تخزين متقدم لبيانات إدارة الوقت محلياً
export interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'work' | 'personal' | 'study' | 'fitness' | 'health' | 'family';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  estimatedTime?: number; // في الدقائق
  actualTime?: number; // الوقت الفعلي المستغرق
  subtasks: SubTask[];
  tags: string[];
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  pomodoroSessions: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  energy: 'low' | 'medium' | 'high'; // الطاقة المطلوبة
  location?: string;
  notes?: string;
  attachments?: string[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: 'health' | 'learning' | 'productivity' | 'social' | 'spiritual';
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number; // العدد المستهدف (مثلاً 8 أكواب ماء يومياً)
  unit?: string; // الوحدة (كوب، دقيقة، مرة)
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  createdAt: Date;
  isActive: boolean;
  reminder?: {
    enabled: boolean;
    time: string;
    days: number[]; // أيام الأسبوع (0 = الأحد)
  };
  color: string;
  icon: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  count: number;
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  priority: 'low' | 'medium' | 'high';
  progress: number; // 0-100
  taskIds: string[];
  createdAt: Date;
  goals: string[];
  budget?: number;
  timeSpent: number; // إجمالي الوقت المستغرق بالدقائق
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  duration: number; // بالدقائق
  breakDuration: number;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  interrupted: boolean;
  notes?: string;
  focus: 1 | 2 | 3 | 4 | 5; // مستوى التركيز
  productivity: 1 | 2 | 3 | 4 | 5; // مستوى الإنتاجية
}

export interface TimeBlock {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  category: string;
  color: string;
  taskId?: string;
  projectId?: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  reminder: boolean;
  location?: string;
}

export interface Analytics {
  productivity: {
    daily: { date: string; score: number; tasksCompleted: number; timeSpent: number }[];
    weekly: { week: string; score: number; tasksCompleted: number; timeSpent: number }[];
    monthly: { month: string; score: number; tasksCompleted: number; timeSpent: number }[];
  };
  habits: {
    completionRate: number;
    streakData: { habitId: string; streak: number }[];
    categoryStats: { category: string; completionRate: number }[];
  };
  timeTracking: {
    categoryBreakdown: { category: string; minutes: number; percentage: number }[];
    pomodoroStats: { date: string; sessions: number; focusScore: number }[];
    peakHours: { hour: number; productivity: number }[];
  };
  goals: {
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ar' | 'en';
  notifications: {
    enabled: boolean;
    sound: boolean;
    taskReminders: boolean;
    habitReminders: boolean;
    pomodoroBreaks: boolean;
    weeklyReports: boolean;
  };
  pomodoro: {
    workDuration: number;
    shortBreak: number;
    longBreak: number;
    sessionsUntilLongBreak: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
  };
  productivity: {
    workingHours: { start: string; end: string };
    workingDays: number[];
    deepWorkHours: { start: string; end: string }[];
    timezone: string;
  };
  goals: {
    dailyTaskTarget: number;
    weeklyHoursTarget: number;
    monthlyProjectsTarget: number;
  };
}

class TimeStorage {
  private static instance: TimeStorage;
  private readonly STORAGE_KEYS = {
    TASKS: 'time_management_tasks',
    HABITS: 'time_management_habits',
    HABIT_LOGS: 'time_management_habit_logs',
    PROJECTS: 'time_management_projects',
    POMODORO_SESSIONS: 'time_management_pomodoro_sessions',
    TIME_BLOCKS: 'time_management_time_blocks',
    ANALYTICS: 'time_management_analytics',
    SETTINGS: 'time_management_settings',
    BACKUP: 'time_management_backup'
  };

  private constructor() {
    this.initializeStorage();
  }

  public static getInstance(): TimeStorage {
    if (!TimeStorage.instance) {
      TimeStorage.instance = new TimeStorage();
    }
    return TimeStorage.instance;
  }

  private initializeStorage(): void {
    // إنشاء البيانات الافتراضية إذا لم تكن موجودة
    Object.values(this.STORAGE_KEYS).forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(this.getDefaultData(key)));
      }
    });
  }

  private getDefaultData(key: string): any {
    switch (key) {
      case this.STORAGE_KEYS.TASKS:
        return [];
      case this.STORAGE_KEYS.HABITS:
        return this.getDefaultHabits();
      case this.STORAGE_KEYS.HABIT_LOGS:
        return [];
      case this.STORAGE_KEYS.PROJECTS:
        return [];
      case this.STORAGE_KEYS.POMODORO_SESSIONS:
        return [];
      case this.STORAGE_KEYS.TIME_BLOCKS:
        return [];
      case this.STORAGE_KEYS.ANALYTICS:
        return this.getDefaultAnalytics();
      case this.STORAGE_KEYS.SETTINGS:
        return this.getDefaultSettings();
      default:
        return {};
    }
  }

  private getDefaultHabits(): Habit[] {
    return [
      {
        id: 'habit_1',
        name: 'شرب الماء',
        description: 'شرب 8 أكواب من الماء يومياً',
        category: 'health',
        frequency: 'daily',
        targetCount: 8,
        unit: 'كوب',
        streak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        createdAt: new Date(),
        isActive: true,
        color: '#3B82F6',
        icon: '💧'
      },
      {
        id: 'habit_2',
        name: 'القراءة',
        description: 'قراءة 30 دقيقة يومياً',
        category: 'learning',
        frequency: 'daily',
        targetCount: 30,
        unit: 'دقيقة',
        streak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        createdAt: new Date(),
        isActive: true,
        color: '#10B981',
        icon: '📚'
      },
      {
        id: 'habit_3',
        name: 'التمارين الصباحية',
        description: 'ممارسة التمارين لمدة 20 دقيقة صباحاً',
        category: 'health',
        frequency: 'daily',
        targetCount: 20,
        unit: 'دقيقة',
        streak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        createdAt: new Date(),
        isActive: true,
        color: '#F59E0B',
        icon: '🏃‍♂️'
      }
    ];
  }

  private getDefaultAnalytics(): Analytics {
    return {
      productivity: {
        daily: [],
        weekly: [],
        monthly: []
      },
      habits: {
        completionRate: 0,
        streakData: [],
        categoryStats: []
      },
      timeTracking: {
        categoryBreakdown: [],
        pomodoroStats: [],
        peakHours: []
      },
      goals: {
        completed: 0,
        inProgress: 0,
        overdue: 0,
        completionRate: 0
      }
    };
  }

  private getDefaultSettings(): UserSettings {
    return {
      theme: 'auto',
      language: 'ar',
      notifications: {
        enabled: true,
        sound: true,
        taskReminders: true,
        habitReminders: true,
        pomodoroBreaks: true,
        weeklyReports: true
      },
      pomodoro: {
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        sessionsUntilLongBreak: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false
      },
      productivity: {
        workingHours: { start: '09:00', end: '17:00' },
        workingDays: [1, 2, 3, 4, 5], // الاثنين - الجمعة
        deepWorkHours: [
          { start: '09:00', end: '11:00' },
          { start: '14:00', end: '16:00' }
        ],
        timezone: 'Asia/Riyadh'
      },
      goals: {
        dailyTaskTarget: 5,
        weeklyHoursTarget: 40,
        monthlyProjectsTarget: 2
      }
    };
  }

  // إدارة المهام
  public getTasks(): Task[] {
    const tasks = localStorage.getItem(this.STORAGE_KEYS.TASKS);
    return tasks ? JSON.parse(tasks).map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined
    })) : [];
  }

  public saveTask(task: Task): void {
    const tasks = this.getTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    
    if (existingIndex >= 0) {
      tasks[existingIndex] = { ...task, updatedAt: new Date() };
    } else {
      tasks.push(task);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.updateAnalytics();
  }

  public deleteTask(id: string): void {
    const tasks = this.getTasks().filter(t => t.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.updateAnalytics();
  }

  // إدارة العادات
  public getHabits(): Habit[] {
    const habits = localStorage.getItem(this.STORAGE_KEYS.HABITS);
    return habits ? JSON.parse(habits).map((habit: any) => ({
      ...habit,
      createdAt: new Date(habit.createdAt)
    })) : [];
  }

  public saveHabit(habit: Habit): void {
    const habits = this.getHabits();
    const existingIndex = habits.findIndex(h => h.id === habit.id);
    
    if (existingIndex >= 0) {
      habits[existingIndex] = habit;
    } else {
      habits.push(habit);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }

  public getHabitLogs(habitId?: string, date?: string): HabitLog[] {
    const logs = localStorage.getItem(this.STORAGE_KEYS.HABIT_LOGS);
    let habitLogs: HabitLog[] = logs ? JSON.parse(logs).map((log: any) => ({
      ...log,
      createdAt: new Date(log.createdAt)
    })) : [];

    if (habitId) {
      habitLogs = habitLogs.filter(log => log.habitId === habitId);
    }

    if (date) {
      habitLogs = habitLogs.filter(log => log.date === date);
    }

    return habitLogs;
  }

  public saveHabitLog(log: HabitLog): void {
    const logs = this.getHabitLogs();
    const existingIndex = logs.findIndex(l => l.habitId === log.habitId && l.date === log.date);
    
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs));
    this.updateHabitStreaks(log.habitId);
  }

  private updateHabitStreaks(habitId: string): void {
    const habit = this.getHabits().find(h => h.id === habitId);
    if (!habit) return;

    const logs = this.getHabitLogs(habitId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    let checkDate = new Date(today);

    // حساب الخط المستمر الحالي
    for (let i = 0; i < 365; i++) { // فحص آخر سنة
      const dateStr = checkDate.toISOString().split('T')[0];
      const log = logs.find(l => l.date === dateStr);
      
      if (log && log.completed) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        if (i === 0) break; // إذا لم يكمل اليوم، فالخط انقطع
        tempStreak = 0;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // تحديث الإحصائيات
    habit.streak = currentStreak;
    habit.longestStreak = Math.max(longestStreak, tempStreak);
    habit.totalCompletions = logs.filter(log => log.completed).length;
    
    this.saveHabit(habit);
  }

  // إدارة المشاريع
  public getProjects(): Project[] {
    const projects = localStorage.getItem(this.STORAGE_KEYS.PROJECTS);
    return projects ? JSON.parse(projects).map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      startDate: project.startDate ? new Date(project.startDate) : undefined,
      endDate: project.endDate ? new Date(project.endDate) : undefined
    })) : [];
  }

  public saveProject(project: Project): void {
    const projects = this.getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  // إدارة جلسات البومودورو
  public getPomodoroSessions(taskId?: string): PomodoroSession[] {
    const sessions = localStorage.getItem(this.STORAGE_KEYS.POMODORO_SESSIONS);
    let pomodoroSessions: PomodoroSession[] = sessions ? JSON.parse(sessions).map((session: any) => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined
    })) : [];

    if (taskId) {
      pomodoroSessions = pomodoroSessions.filter(session => session.taskId === taskId);
    }

    return pomodoroSessions;
  }

  public savePomodoroSession(session: PomodoroSession): void {
    const sessions = this.getPomodoroSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.POMODORO_SESSIONS, JSON.stringify(sessions));
  }

  // تحديث الإحصائيات
  private updateAnalytics(): void {
    const tasks = this.getTasks();
    const habits = this.getHabits();
    const habitLogs = this.getHabitLogs();
    const pomodoroSessions = this.getPomodoroSessions();
    
    const analytics: Analytics = {
      productivity: this.calculateProductivityStats(tasks, pomodoroSessions),
      habits: this.calculateHabitStats(habits, habitLogs),
      timeTracking: this.calculateTimeTrackingStats(tasks, pomodoroSessions),
      goals: this.calculateGoalStats(tasks)
    };
    
    localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
  }

  private calculateProductivityStats(tasks: Task[], sessions: PomodoroSession[]): Analytics['productivity'] {
    // حساب إحصائيات الإنتاجية
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const daily = last30Days.map(date => {
      const dayTasks = tasks.filter(task => 
        task.completedAt && task.completedAt.toISOString().split('T')[0] === date
      );
      const daySessions = sessions.filter(session =>
        session.startTime.toISOString().split('T')[0] === date
      );
      
      return {
        date,
        score: this.calculateDayProductivityScore(dayTasks, daySessions),
        tasksCompleted: dayTasks.length,
        timeSpent: dayTasks.reduce((total, task) => total + (task.actualTime || 0), 0)
      };
    });

    return {
      daily,
      weekly: [], // يمكن تطويرها لاحقاً
      monthly: [] // يمكن تطويرها لاحقاً
    };
  }

  private calculateDayProductivityScore(tasks: Task[], sessions: PomodoroSession[]): number {
    let score = 0;
    
    // نقاط للمهام المكتملة
    score += tasks.length * 10;
    
    // نقاط للأولوية
    tasks.forEach(task => {
      switch (task.priority) {
        case 'urgent': score += 20; break;
        case 'high': score += 15; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }
    });
    
    // نقاط لجلسات البومودورو المكتملة
    const completedSessions = sessions.filter(s => s.completed);
    score += completedSessions.length * 5;
    
    // نقاط لمستوى التركيز
    const avgFocus = completedSessions.reduce((sum, s) => sum + s.focus, 0) / completedSessions.length || 0;
    score += avgFocus * 2;
    
    return Math.min(score, 100); // الحد الأقصى 100
  }

  private calculateHabitStats(habits: Habit[], logs: HabitLog[]): Analytics['habits'] {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = logs.filter(log => log.date === today && log.completed);
    const totalHabitsToday = habits.filter(h => h.isActive).length;
    
    return {
      completionRate: totalHabitsToday > 0 ? (completedToday.length / totalHabitsToday) * 100 : 0,
      streakData: habits.map(habit => ({ habitId: habit.id, streak: habit.streak })),
      categoryStats: this.calculateCategoryStats(habits, logs)
    };
  }

  private calculateCategoryStats(habits: Habit[], logs: HabitLog[]): { category: string; completionRate: number }[] {
    const categories = ['health', 'learning', 'productivity', 'social', 'spiritual'];
    
    return categories.map(category => {
      const categoryHabits = habits.filter(h => h.category === category && h.isActive);
      if (categoryHabits.length === 0) return { category, completionRate: 0 };
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });
      
      const totalOpportunities = categoryHabits.length * 7;
      const completedCount = last7Days.reduce((total, date) => {
        return total + categoryHabits.reduce((dayTotal, habit) => {
          const log = logs.find(l => l.habitId === habit.id && l.date === date);
          return dayTotal + (log && log.completed ? 1 : 0);
        }, 0);
      }, 0);
      
      return {
        category,
        completionRate: totalOpportunities > 0 ? (completedCount / totalOpportunities) * 100 : 0
      };
    });
  }

  private calculateTimeTrackingStats(tasks: Task[], sessions: PomodoroSession[]): Analytics['timeTracking'] {
    // حساب توزيع الوقت حسب الفئة
    const categoryBreakdown = this.calculateCategoryBreakdown(tasks);
    
    // إحصائيات البومودورو
    const pomodoroStats = this.calculatePomodoroStats(sessions);
    
    // ساعات الذروة
    const peakHours = this.calculatePeakHours(sessions);
    
    return {
      categoryBreakdown,
      pomodoroStats,
      peakHours
    };
  }

  private calculateCategoryBreakdown(tasks: Task[]): { category: string; minutes: number; percentage: number }[] {
    const categories = ['work', 'personal', 'study', 'fitness', 'health', 'family'];
    const totalMinutes = tasks.reduce((total, task) => total + (task.actualTime || 0), 0);
    
    return categories.map(category => {
      const categoryMinutes = tasks
        .filter(task => task.category === category)
        .reduce((total, task) => total + (task.actualTime || 0), 0);
      
      return {
        category,
        minutes: categoryMinutes,
        percentage: totalMinutes > 0 ? (categoryMinutes / totalMinutes) * 100 : 0
      };
    });
  }

  private calculatePomodoroStats(sessions: PomodoroSession[]): { date: string; sessions: number; focusScore: number }[] {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const daySessions = sessions.filter(session =>
        session.startTime.toISOString().split('T')[0] === date && session.completed
      );
      
      const avgFocus = daySessions.reduce((sum, s) => sum + s.focus, 0) / daySessions.length || 0;
      
      return {
        date,
        sessions: daySessions.length,
        focusScore: avgFocus
      };
    });
  }

  private calculatePeakHours(sessions: PomodoroSession[]): { hour: number; productivity: number }[] {
    const hourStats: { [hour: number]: { total: number; focus: number; count: number } } = {};
    
    sessions.filter(s => s.completed).forEach(session => {
      const hour = session.startTime.getHours();
      if (!hourStats[hour]) {
        hourStats[hour] = { total: 0, focus: 0, count: 0 };
      }
      hourStats[hour].focus += session.focus;
      hourStats[hour].count += 1;
      hourStats[hour].total += session.duration;
    });
    
    return Object.entries(hourStats).map(([hour, stats]) => ({
      hour: parseInt(hour),
      productivity: (stats.focus / stats.count) * (stats.total / 60) // التركيز × الوقت
    })).sort((a, b) => b.productivity - a.productivity);
  }

  private calculateGoalStats(tasks: Task[]): Analytics['goals'] {
    const completed = tasks.filter(task => task.status === 'completed').length;
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;
    const overdue = tasks.filter(task => 
      task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
    ).length;
    
    const total = tasks.length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      completed,
      inProgress,
      overdue,
      completionRate
    };
  }

  // الحصول على الإحصائيات
  public getAnalytics(): Analytics {
    const analytics = localStorage.getItem(this.STORAGE_KEYS.ANALYTICS);
    return analytics ? JSON.parse(analytics) : this.getDefaultAnalytics();
  }

  // إدارة الإعدادات
  public getSettings(): UserSettings {
    const settings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : this.getDefaultSettings();
  }

  public saveSettings(settings: UserSettings): void {
    localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // النسخ الاحتياطي والاستعادة
  public createBackup(): string {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        tasks: this.getTasks(),
        habits: this.getHabits(),
        habitLogs: this.getHabitLogs(),
        projects: this.getProjects(),
        pomodoroSessions: this.getPomodoroSessions(),
        analytics: this.getAnalytics(),
        settings: this.getSettings()
      }
    };
    
    const backupString = JSON.stringify(backup);
    localStorage.setItem(this.STORAGE_KEYS.BACKUP, backupString);
    return backupString;
  }

  public restoreFromBackup(backupString: string): boolean {
    try {
      const backup = JSON.parse(backupString);
      
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup format');
      }
      
      // استعادة البيانات
      localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(backup.data.tasks));
      localStorage.setItem(this.STORAGE_KEYS.HABITS, JSON.stringify(backup.data.habits));
      localStorage.setItem(this.STORAGE_KEYS.HABIT_LOGS, JSON.stringify(backup.data.habitLogs));
      localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(backup.data.projects));
      localStorage.setItem(this.STORAGE_KEYS.POMODORO_SESSIONS, JSON.stringify(backup.data.pomodoroSessions));
      localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(backup.data.analytics));
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(backup.data.settings));
      
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  }

  // تنظيف البيانات القديمة
  public cleanupOldData(daysToKeep: number = 90): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // تنظيف سجلات العادات القديمة
    const habitLogs = this.getHabitLogs().filter(log => 
      new Date(log.date) >= cutoffDate
    );
    localStorage.setItem(this.STORAGE_KEYS.HABIT_LOGS, JSON.stringify(habitLogs));
    
    // تنظيف جلسات البومودورو القديمة
    const pomodoroSessions = this.getPomodoroSessions().filter(session =>
      session.startTime >= cutoffDate
    );
    localStorage.setItem(this.STORAGE_KEYS.POMODORO_SESSIONS, JSON.stringify(pomodoroSessions));
  }
}

export const timeStorage = TimeStorage.getInstance();
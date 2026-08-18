import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Trophy,
  Star,
  Search,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface AdminUser {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  points: number;
  level: number;
  totalTestsTaken: number;
  lastVisit?: string;
  createdAt?: string;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [inputSearch, setInputSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery<UsersResponse>({
    queryKey: ['/api/admin/users', page, searchTerm],
    retry: false,
    staleTime: 0
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleSearch = () => {
    setSearchTerm(inputSearch);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">جاري تحميل بيانات الطلاب...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-red-600 mb-4">لا يمكن تحميل بيانات الطلاب في الوقت الحالي</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              إدارة الطلاب
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              عرض جميع الطلاب المسجلين على المنصة
            </p>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث البيانات
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{total.toLocaleString('ar')}</div>
              <div className="text-sm text-blue-600">إجمالي الطلاب</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-700">
                {users.length > 0 ? Math.round(users.reduce((s, u) => s + u.points, 0) / users.length).toLocaleString('ar') : 0}
              </div>
              <div className="text-sm text-yellow-600">متوسط النقاط</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-green-700 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">
                {users.filter(u => u.totalTestsTaken > 0).length}
              </div>
              <div className="text-sm text-green-700">أجروا اختباراً</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث بالاسم أو البريد..."
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-10"
              data-testid="search-users"
            />
          </div>
          <Button onClick={handleSearch} data-testid="btn-search-users">بحث</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            قائمة الطلاب ({total.toLocaleString('ar')})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الطالب</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">النقاط</TableHead>
                  <TableHead className="text-right">المستوى</TableHead>
                  <TableHead className="text-right">الاختبارات</TableHead>
                  <TableHead className="text-right">آخر زيارة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, i) => (
                  <TableRow key={user._id} data-testid={`user-row-${i}`}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{user.fullName || user.username}</p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{user.email || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{user.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{user.points.toLocaleString('ar')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-blue-500" />
                        <span>{user.level}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`tests-taken-${i}`}>
                      {user.totalTestsTaken}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {user.lastVisit ? new Date(user.lastVisit).toLocaleDateString('ar-EG') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد نتائج تطابق البحث</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500">
              صفحة {page} من {totalPages} ({total.toLocaleString('ar')} طالب)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="btn-prev-page"
              >
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                data-testid="btn-next-page"
              >
                التالي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

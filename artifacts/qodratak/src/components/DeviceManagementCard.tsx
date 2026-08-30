import { useEffect, useState } from "react";
import { Laptop, Loader2, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { getDeviceId } from "@/lib/device";
import { useToast } from "@/hooks/use-toast";

type Device = {
  id: string;
  label: string;
  firstSeenAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

export function DeviceManagementCard() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/devices", {
        credentials: "include",
        headers: { "x-device-id": getDeviceId() },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("تعذر قراءة الأجهزة");
      const result = await response.json();
      setDevices(result.devices || []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDevices();
  }, []);

  const removeDevice = async (device: Device) => {
    setRemoving(device.id);
    try {
      const response = await fetch(`/api/user/devices/${device.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر حذف الجهاز");
      setDevices((current) => current.filter((item) => item.id !== device.id));
      toast({
        title: "تم حذف الجهاز",
        description: device.isCurrent
          ? "سيُطلب تسجيل هذا الجهاز مجدداً عند الدخول القادم."
          : "يمكنك الآن تسجيل الدخول من جهاز جديد.",
      });
    } catch (error: any) {
      toast({ title: "تعذر حذف الجهاز", description: error.message, variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-black text-slate-900">إدارة الأجهزة</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">يمكن استخدام الحساب على جهازين كحد أقصى.</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {devices.length} من 2
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> جاري تحميل الأجهزة
        </div>
      ) : devices.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">سيظهر جهازك هنا بعد تسجيل الدخول القادم.</p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {devices.map((device) => {
            const mobile = /iPhone|iPad|Android/i.test(device.label);
            const Icon = mobile ? Smartphone : Laptop;
            return (
              <div key={device.id} className={`rounded-xl border p-4 ${device.isCurrent ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2.5">
                    <Icon className="mt-0.5 h-5 w-5 text-slate-600" />
                    <div>
                      <p className="text-sm font-black text-slate-800">{device.label}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        آخر دخول {new Date(device.lastSeenAt).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      {device.isCurrent && <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">هذا الجهاز</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDevice(device)}
                    disabled={removing === device.id}
                    aria-label={`حذف ${device.label}`}
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {removing === device.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
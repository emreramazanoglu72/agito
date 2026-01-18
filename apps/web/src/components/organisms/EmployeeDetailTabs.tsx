
import React, { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useEmployeePayments, useEmployeeDocuments, useEmployeeActivities, useUploadDocument } from '@/hooks/queries/useEmployees';
import { usePolicies, useCreatePolicy, useAssignPolicy, useEmployeePolicies } from '@/hooks/queries/usePolicies';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { cn } from '@/lib/utils';
import { Shield, CreditCard, FileText, Clock, Plus, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DynamicForm } from './dynamic-form/DynamicForm';
import { policyCreateSchema, documentUploadSchema } from '@/data/schemas';
import { useToast } from '@/components/ui/use-toast';
import { UnifiedFormHeader } from '@/components/molecules/UnifiedFormHeader';
import { Input } from '@/components/ui/input';

ChartJS.register(ArcElement, Tooltip, Legend);

interface EmployeeDetailTabsProps {
    employeeId: string;
    companyId?: string;
}

type EmployeePolicy = {
    id: string;
    policyNo: string;
    type: string;
    premium: number;
    status: string;
};

export const EmployeeDetailTabs: React.FC<EmployeeDetailTabsProps> = ({ employeeId, companyId }) => {
    const { data: policiesResponse } = useEmployeePolicies(employeeId);
    const { data: policyCatalog } = usePolicies({ limit: 50, companyId });
    const { data: paymentsResponse } = useEmployeePayments(employeeId);
    const { data: documentsResponse } = useEmployeeDocuments(employeeId);
    const { data: activitiesResponse } = useEmployeeActivities(employeeId);

    const policies = useMemo(() => {
        if (!policiesResponse) return [];
        return (policiesResponse as any).data ?? (Array.isArray(policiesResponse) ? policiesResponse : []);
    }, [policiesResponse]);

    const createPolicyMutation = useCreatePolicy();
    const assignPolicyMutation = useAssignPolicy();
    const uploadDocumentMutation = useUploadDocument();
    const { toast } = useToast();

    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [policyModalTab, setPolicyModalTab] = useState('select');
    const [policySearch, setPolicySearch] = useState('');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const handleCreatePolicy = async (data: any) => {
        try {
            await createPolicyMutation.mutateAsync({ ...data, employeeId });
            toast({ title: 'Başarılı', description: 'Poliçe oluşturuldu' });
            setPolicyModalOpen(false);
        } catch (error) {
            toast({ title: 'Hata', description: 'Poliçe oluşturulamadı' });
        }
    };

    const handleFileUpload = async (data: any) => {
        const files = data.files as File[];
        if (!files || files.length === 0) return;

        try {
            // Upload files sequentially or in parallel. Parallel is better for UX.
            await Promise.all(files.map(file =>
                uploadDocumentMutation.mutateAsync({ employeeId, file })
            ));

            toast({ title: 'Başarılı', description: `${files.length} dosya yüklendi` });
            setUploadModalOpen(false);
        } catch (error) {
            toast({ title: 'Hata', description: 'Dosya yüklenemedi' });
        }
    };

    const handleAssignPolicy = async (policyId: string) => {
        try {
            await assignPolicyMutation.mutateAsync({ policyId, employeeId });
            toast({ title: 'Başarılı', description: 'Poliçe çalışana bağlandı' });
            setPolicyModalOpen(false);
        } catch (error) {
            toast({ title: 'Hata', description: 'Poliçe bağlanamadı' });
        }
    };

    const payments = useMemo(() => {
        if (!paymentsResponse) return [];
        return (paymentsResponse as any).data ?? (Array.isArray(paymentsResponse) ? paymentsResponse : []);
    }, [paymentsResponse]);

    const documents = useMemo(() => {
        if (!documentsResponse) return [];
        return (documentsResponse as any).data ?? (Array.isArray(documentsResponse) ? documentsResponse : []);
    }, [documentsResponse]);

    const activities = useMemo(() => {
        if (!activitiesResponse) return [];
        return (activitiesResponse as any).data ?? (Array.isArray(activitiesResponse) ? activitiesResponse : []);
    }, [activitiesResponse]);

    const availablePolicies = useMemo(() => {
        const list = policyCatalog?.data || [];
        const trimmedSearch = policySearch.trim().toLowerCase();
        const filtered = list.filter((policy: any) => policy.employeeId !== employeeId);

        if (!trimmedSearch) {
            return filtered;
        }

        return filtered.filter((policy: any) => {
            const employeeLabel = policy.employee
                ? `${policy.employee.firstName || ''} ${policy.employee.lastName || ''}`.trim()
                : '';
            return [
                policy.policyNo,
                policy.type,
                policy.status,
                employeeLabel
            ]
                .filter(Boolean)
                .some((value: string) => value.toLowerCase().includes(trimmedSearch));
        });
    }, [policyCatalog?.data, policySearch, employeeId]);

    const paymentStats = React.useMemo(() => {
        if (!payments) return null;
        const stats = { PAID: 0, PENDING: 0, OVERDUE: 0 };
        payments.forEach((p: any) => {
            const status = p.status as keyof typeof stats;
            if (stats[status] !== undefined) stats[status]++;
        });
        return {
            labels: ['Ödenen', 'Bekleyen', 'Geciken'],
            datasets: [{
                data: [stats.PAID, stats.PENDING, stats.OVERDUE],
                backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                borderWidth: 0,
            }]
        };
    }, [payments]);

    const tabTriggerClass = "px-6 py-4 text-sm font-medium text-slate-500 transition-all border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:text-teal-600";

    return (
        <>
            <Dialog
                open={policyModalOpen}
                onOpenChange={(open) => {
                    setPolicyModalOpen(open);
                    if (open) {
                        setPolicyModalTab('select');
                        setPolicySearch('');
                    }
                }}
            >
                <DialogContent className="max-w-4xl p-0 bg-white max-h-[90vh] flex flex-col" hideClose>
                    <UnifiedFormHeader
                        title="Poliçe Ekle"
                        subtitle="Mevcut poliçeyi ata veya yeni poliçe oluştur"
                        badgeText="Hızlı İşlem"
                        onClose={() => setPolicyModalOpen(false)}
                        mode="dialog"
                        icon={Shield}
                    />
                    <div className="px-6 pb-6 pt-2 overflow-y-auto">
                        <Tabs.Root value={policyModalTab} onValueChange={setPolicyModalTab}>
                            <Tabs.List className="flex gap-2 border-b border-slate-100">
                                <Tabs.Trigger value="select" className={cn(tabTriggerClass, "text-slate-600")}>
                                    Mevcut Poliçeler
                                </Tabs.Trigger>
                                <Tabs.Trigger value="create" className={cn(tabTriggerClass, "text-slate-600")}>
                                    Yeni Poliçe Oluştur
                                </Tabs.Trigger>
                            </Tabs.List>

                            <Tabs.Content value="select" className="space-y-4 pt-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h4 className="text-base font-semibold text-slate-800">Katalogtan ata</h4>
                                        <p className="text-sm text-slate-500">Şirket poliçelerini seçip bu çalışana bağlayın.</p>
                                    </div>
                                    <Input
                                        value={policySearch}
                                        onChange={(event) => setPolicySearch(event.target.value)}
                                        placeholder="Poliçe no, tür, kişi ara..."
                                        className="h-10 max-w-xs"
                                    />
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-slate-100 max-h-[55vh] overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">Poliçe No</th>
                                                <th className="px-4 py-3">Tür</th>
                                                <th className="px-4 py-3">Çalışan</th>
                                                <th className="px-4 py-3">Durum</th>
                                                <th className="px-4 py-3 text-right">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {availablePolicies.map((policy: any) => (
                                                <tr key={policy.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-4 font-medium">{policy.policyNo}</td>
                                                    <td className="px-4 py-4 text-slate-500">{policy.type}</td>
                                                    <td className="px-4 py-4 text-slate-500">
                                                        {policy.employee
                                                            ? `${policy.employee.firstName} ${policy.employee.lastName}`
                                                            : '-'}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <StatusBadge status={policy.status} />
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAssignPolicy(policy.id)}
                                                            disabled={assignPolicyMutation.isPending}
                                                        >
                                                            Bu çalışana ata
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!availablePolicies.length && (
                                                <tr>
                                                    <td colSpan={5} className="p-4 text-center text-slate-500">
                                                        Katalogta atanabilir poliçe bulunamadı.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Tabs.Content>

                            <Tabs.Content value="create" className="pt-4">
                                <div className="mb-4">
                                    <h4 className="text-base font-semibold text-slate-800">Yeni poliçe oluştur</h4>
                                    <p className="text-sm text-slate-500">Gerekli temel bilgileri girin, sistem poliçe numarasını otomatik üretir.</p>
                                </div>
                                <DynamicForm
                                    schema={policyCreateSchema}
                                    onSubmit={handleCreatePolicy}
                                    submitLabel="Poliçe Oluştur"
                                    loading={createPolicyMutation.isPending}
                                />
                            </Tabs.Content>
                        </Tabs.Root>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                <DialogContent className="max-w-xl p-0 bg-white" hideClose>
                    <UnifiedFormHeader
                        title="Dosya Yükle"
                        subtitle="Döküman Yönetimi"
                        badgeText="Yükleme"
                        onClose={() => setUploadModalOpen(false)}
                        mode="dialog"
                        icon={FileText}
                    />
                    <div className="p-6">
                        <DynamicForm
                            schema={documentUploadSchema}
                            onSubmit={handleFileUpload}
                            submitLabel="Yüklemeyi Başlat"
                            loading={uploadDocumentMutation.isPending}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Tabs.Root defaultValue="policies" className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
                <Tabs.List className="flex border-b border-slate-100 px-4">
                    <Tabs.Trigger value="policies" className={tabTriggerClass}>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Poliçeler
                        </div>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="payments" className={tabTriggerClass}>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Ödemeler
                        </div>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="documents" className={tabTriggerClass}>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Dökümanlar
                        </div>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="activity" className={tabTriggerClass}>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            İşlem Geçmişi
                        </div>
                    </Tabs.Trigger>
                </Tabs.List>

                <div className="p-6">
                    <Tabs.Content value="policies" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Aktif Poliçeler</h3>
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => setPolicyModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Yeni Poliçe
                            </Button>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Poliçe No</th>
                                        <th className="px-4 py-3">Tür</th>
                                        <th className="px-4 py-3">Prim</th>
                                        <th className="px-4 py-3">Durum</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {policies?.map((policy: EmployeePolicy) => (
                                        <tr key={policy.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-4 font-medium">{policy.policyNo}</td>
                                            <td className="px-4 py-4 text-slate-500">{policy.type}</td>
                                            <td className="px-4 py-4 font-semibold text-slate-900">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(policy.premium)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge status={policy.status} />
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button className="text-slate-400 hover:text-teal-600">
                                                    <ExternalLink className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!policies?.length && (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-slate-500">Kayıt bulunamadı.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="payments" className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <h3 className="mb-6 text-lg font-semibold">Ödeme Planı</h3>
                            <div className="overflow-hidden rounded-2xl border border-slate-100">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Taksit</th>
                                            <th className="px-4 py-3">Tutar</th>
                                            <th className="px-4 py-3">Vade</th>
                                            <th className="px-4 py-3">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {payments?.map((p: any) => (
                                            <tr key={p.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-4 font-medium">{p.installment}. Taksit</td>
                                                <td className="px-4 py-4 font-semibold text-slate-900">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(p.amount)}
                                                </td>
                                                <td className="px-4 py-4 text-slate-500">{new Date(p.dueDate).toLocaleDateString('tr-TR')}</td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={p.status} />
                                                </td>
                                            </tr>
                                        ))}
                                        {!payments?.length && (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-slate-500">Ödeme planı bulunamadı.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-slate-500">Ödeme Dağılımı</h3>
                            <div className="aspect-square">
                                {paymentStats && (
                                    <Doughnut
                                        data={paymentStats}
                                        options={{
                                            cutout: '70%',
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: { usePointStyle: true, boxWidth: 6, font: { size: 10 } }
                                                }
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="documents" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Döküman Arşivi</h3>
                            <Button size="sm" variant="outline" onClick={() => setUploadModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Dosya Yükle
                            </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {documents?.map((doc: any) => (
                                <div key={doc.id} className="group relative flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition-all hover:border-teal-200 hover:bg-teal-50/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="truncate text-sm font-medium">{doc.name}</div>
                                            <div className="text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB</div>
                                        </div>
                                    </div>
                                    <button className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-teal-600">
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {!documents?.length && (
                                <div className="col-span-full py-10 text-center text-slate-500 border border-dashed rounded-xl">
                                    Döküman bulunamadı.
                                </div>
                            )}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="activity">
                        <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-slate-100">
                            {activities?.map((activity: any, i: any) => (
                                <div key={activity.id} className="relative pl-12">
                                    <div className="absolute left-1 top-1.5 h-6 w-6 rounded-full border-4 border-white bg-teal-500 shadow-sm"></div>
                                    <div className="text-sm font-semibold">{activity.type}</div>
                                    <div className="mt-1 text-sm text-slate-500">{activity.description}</div>
                                    <div className="mt-2 text-xs text-slate-400">
                                        {new Date(activity.timestamp).toLocaleString('tr-TR')}
                                    </div>
                                </div>
                            ))}
                            {!activities?.length && (
                                <div className="py-10 text-center text-slate-500">İşlem geçmişi bulunamadı.</div>
                            )}
                        </div>
                    </Tabs.Content>
                </div>
            </Tabs.Root>
        </>
    );
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllSettings } from '@/utils/supabase/supabase';
import BusinessSettingsForm from './_components/BusinessSettingsForm';
import InventorySettingsForm from './_components/InventorySettingsForm';
import RecipeSettingsForm from './_components/RecipeSettingsForm';
import ReportSettingsForm from './_components/ReportSettingsForm';
import UserPermissionsForm from './_components/UserPermissionsForm';
import NotificationSettingsForm from './_components/NotificationSettingsForm';
import SystemSettingsForm from './_components/SystemSettingsForm';
import BrandBranchSetupForm from './_components/BrandBranchSetupForm';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [settings] = await Promise.all([getAllSettings(), minDelay()]);

  return (
    <div className='container mx-auto p-4'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>설정</h1>
        <p className='text-muted-foreground'>시스템 설정을 관리합니다.</p>
      </div>

      <Tabs defaultValue='business' className='space-y-6'>
        <TabsList className='flex-wrap h-auto gap-2'>
          <TabsTrigger value='business'>비즈니스 정보</TabsTrigger>
          <TabsTrigger value='inventory'>재고 관리</TabsTrigger>
          <TabsTrigger value='recipe'>메뉴/레시피</TabsTrigger>
          <TabsTrigger value='report'>리포트</TabsTrigger>
          <TabsTrigger value='users'>사용자/권한</TabsTrigger>
          <TabsTrigger value='notification'>알림</TabsTrigger>
          <TabsTrigger value='system'>시스템</TabsTrigger>
          <TabsTrigger value='setup'>브랜드/지점</TabsTrigger>
        </TabsList>

        <TabsContent value='business'>
          <BusinessSettingsForm initialData={settings.business} />
        </TabsContent>

        <TabsContent value='inventory'>
          <InventorySettingsForm initialData={settings.inventory} />
        </TabsContent>

        <TabsContent value='recipe'>
          <RecipeSettingsForm initialData={settings.recipe} />
        </TabsContent>

        <TabsContent value='report'>
          <ReportSettingsForm initialData={settings.report} />
        </TabsContent>

        <TabsContent value='users'>
          <UserPermissionsForm initialData={settings.users} />
        </TabsContent>

        <TabsContent value='notification'>
          <NotificationSettingsForm initialData={settings.notification} />
        </TabsContent>

        <TabsContent value='system'>
          <SystemSettingsForm initialData={settings.system} />
        </TabsContent>

        <TabsContent value='setup'>
          <BrandBranchSetupForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

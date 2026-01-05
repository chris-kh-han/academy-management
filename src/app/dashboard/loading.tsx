import {
  KPISkeleton,
  ChartSkeleton,
  ListSkeleton,
  TableSkeleton,
} from './components/Skeletons';

export default function DashboardLoading() {
  return (
    <div className='p-4 md:p-6 space-y-6'>
      {/* KPI Cards */}
      <KPISkeleton />

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ListSkeleton />
      </div>

      {/* Table */}
      <TableSkeleton />
    </div>
  );
}

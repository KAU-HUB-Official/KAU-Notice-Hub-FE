interface NoticeListSkeletonProps {
  count?: number;
}

export default function NoticeListSkeleton({ count = 6 }: NoticeListSkeletonProps) {
  return (
    <div className="w-full min-w-0 space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="w-full min-w-0 animate-pulse rounded-lg border border-slate-200 bg-white p-4 md:p-5"
        >
          <div className="h-5 w-3/4 rounded bg-slate-200" />

          <div className="mt-3 flex min-w-0 flex-wrap gap-2">
            <div className="h-6 w-20 rounded-md bg-slate-100" />
            <div className="h-6 w-24 rounded-md bg-slate-100" />
            <div className="h-6 w-16 rounded-md bg-slate-100" />
          </div>

          <div className="mt-3 space-y-2">
            <div className="h-3.5 w-full rounded bg-slate-100" />
            <div className="h-3.5 w-11/12 rounded bg-slate-100" />
            <div className="h-3.5 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

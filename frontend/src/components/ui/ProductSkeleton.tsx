export default function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm animate-pulse">
      <div className="relative aspect-square overflow-hidden bg-gray-200 mb-4 rounded-sm"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
  );
}

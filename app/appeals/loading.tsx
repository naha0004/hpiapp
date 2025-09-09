export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-12 w-64 bg-gray-200 rounded-lg mb-8"></div>
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8">
            <div className="space-y-6">
              <div className="h-10 bg-gray-100 rounded-xl"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-gray-100 rounded-xl"></div>
                <div className="h-10 bg-gray-100 rounded-xl"></div>
              </div>
              <div className="h-32 bg-gray-100 rounded-xl"></div>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>
                ))}
              </div>
              <div className="h-12 bg-gray-100 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

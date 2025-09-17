"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
          <p className="text-gray-500 mb-6">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

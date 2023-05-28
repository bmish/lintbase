import Header from '@/components/Header';

export default function Rules() {
  return (
    <div className="bg-gray-100">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6">
        <h1 className="text-2xl font-bold mb-4">Lint Rules</h1>
        <ul className="bg-white shadow overflow-hidden sm:rounded-md">
          <li>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    no-unknown-class
                  </p>
                  <p className="text-sm text-gray-500">
                    Checks for unknown or unused Tailwind CSS classes.
                  </p>
                </div>
              </div>
            </div>
          </li>
          <li>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    no-duplicate-class
                  </p>
                  <p className="text-sm text-gray-500">
                    Ensures that no duplicate classes are used in your markup.
                  </p>
                </div>
              </div>
            </div>
          </li>
          <li>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    no-contradicting-class
                  </p>
                  <p className="text-sm text-gray-500">
                    Flags the usage of classes with conflicting styles or
                    utilities.
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </main>
    </div>
  );
}

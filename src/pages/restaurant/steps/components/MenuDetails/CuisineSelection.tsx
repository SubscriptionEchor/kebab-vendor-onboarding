import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../../../components/ui/Input';
import { ErrorBoundary } from '../../../../../components/ErrorBoundary';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';

interface CuisineSelectionProps {
  cuisines: Array<{ id: string; name: string }>;
  selectedCuisines: string[];
  onCuisineToggle: (cuisineId: string) => void;
  isLoadingCuisines: boolean;
  cuisineError?: Error | null;
  refreshCuisines: () => void;
}

export function CuisineSelection({
  cuisines,
  selectedCuisines,
  onCuisineToggle,
  isLoadingCuisines,
  cuisineError,
  refreshCuisines
}: CuisineSelectionProps) {
  const [cuisineSearch, setCuisineSearch] = useState('');

  const filteredCuisines = useMemo(
    () =>
      cuisines.filter((cuisine) =>
        cuisine.name.toLowerCase().includes(cuisineSearch.toLowerCase())
      ),
    [cuisines, cuisineSearch]
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Kebab Cuisines
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Select 3 cuisines that best represent your restaurant (
        {3 - selectedCuisines.length} selections remaining)
      </p>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search cuisines..."
              value={cuisineSearch}
              onChange={(e) => setCuisineSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <ErrorBoundary
        fallback={
          <div className="p-6 bg-red-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  Failed to load cuisines
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  {cuisineError?.message || 'An unexpected error occurred while loading cuisines'}
                </p>
                <Button
                  onClick={refreshCuisines}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        }
      >
        {isLoadingCuisines ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-lg bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCuisines.map((cuisine) => (
                <button
                  key={cuisine.id}
                  type="button"
                  onClick={() => onCuisineToggle(cuisine.id)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedCuisines.includes(cuisine.name)
                      ? 'bg-brand-primary/10 border-2 border-brand-primary shadow-md'
                      : selectedCuisines.length >= 3
                      ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-200 hover:border-brand-primary/50 hover:shadow-md'
                  }`}
                  disabled={selectedCuisines.length >= 3 && !selectedCuisines.includes(cuisine.name)}
                >
                  <div className="font-medium">{cuisine.name}</div>
                </button>
              ))}
            </div>

            {filteredCuisines.length === 0 && cuisineSearch && (
              <div className="text-center py-8 text-gray-500">
                No cuisines found matching your search
              </div>
            )}
          </>
        )}
      </ErrorBoundary>
    </div>
  );
}
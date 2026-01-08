import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { api } from "../../services/api";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AddressSuggestion {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, placeId?: string) => void;
  onSelectAddress?: (address: {
    formatted_address: string;
    lat: number;
    lng: number;
    place_id: string;
  }) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  country?: string;
  types?: string[];
  className?: string;
  name?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelectAddress,
  label,
  placeholder = "Digite o endereço...",
  error,
  disabled = false,
  country = "br",
  types = ["address"],
  className = "",
  name,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post<{
        predictions: Array<{
          description: string;
          place_id: string;
          structured_formatting: {
            main_text: string;
            secondary_text: string;
          };
        }>;
      }>("/addresses/autocomplete", {
        input,
        country,
        types,
      });

      const formattedSuggestions = response.data.predictions.map((pred) => ({
        description: pred.description,
        place_id: pred.place_id,
        main_text: pred.structured_formatting.main_text,
        secondary_text: pred.structured_formatting.secondary_text,
      }));

      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Limpar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Criar novo timer
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    onChange(suggestion.description, suggestion.place_id);
    setShowSuggestions(false);
    setSuggestions([]);

    // Se tem callback, buscar detalhes completos
    if (onSelectAddress) {
      try {
        const response = await api.post<{
          formatted_address: string;
          geometry: {
            location: {
              lat: number;
              lng: number;
            };
          };
          place_id: string;
        }>("/addresses/place-details", {
          placeId: suggestion.place_id,
        });

        onSelectAddress({
          formatted_address: response.data.formatted_address,
          lat: response.data.geometry.location.lat,
          lng: response.data.geometry.location.lng,
          place_id: response.data.place_id,
        });
      } catch (error) {
        console.error("Erro ao buscar detalhes do lugar:", error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-[#1A1A1A] mb-2">
          {label}
        </label>
      )}

      <div ref={wrapperRef} className={cn("relative", className)}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
          <MapPin size={18} />
        </div>

        <input
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full py-3.5 pl-12 pr-12 text-sm text-[#1A1A1A] bg-white border rounded-xl outline-none transition-all duration-200 placeholder:text-[#9CA3AF]",
            error
              ? "border-[#EF4444] shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
              : "border-[#E5E7EB] focus:border-[#1A1A1A] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.1)]",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        />

        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-transparent"></div>
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10000 mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <ul className="max-h-60 overflow-y-auto py-2">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.place_id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors duration-150",
                      index === selectedIndex ? "bg-[#F9FAFB]" : "hover:bg-[#F9FAFB]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#1A1A1A] text-sm truncate">
                          {suggestion.main_text}
                        </div>
                        <div className="text-xs text-[#6B7280] mt-0.5 truncate">
                          {suggestion.secondary_text}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-xs text-[#EF4444] mt-1.5">{error}</p>}
      </div>
    </div>
  );
}

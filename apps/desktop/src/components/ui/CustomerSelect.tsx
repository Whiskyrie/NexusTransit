import { useState, useEffect, useRef } from "react";
import { Search, Check, ChevronDown, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { customerService } from "../../services/customer.service";
import { CustomerStatus } from "../../types/customer.types";

interface CustomerSelectProps {
  value: string;
  onChange: (customerId: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function CustomerSelect({
  value,
  onChange,
  error,
  placeholder = "Selecione um cliente",
  className = "",
}: CustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", "list", search],
    queryFn: () =>
      customerService.list({
        search,
        limit: 50,
        status: CustomerStatus.ACTIVE, // Apenas clientes ativos
      }),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const customers = data?.data || [];
  const selectedCustomer = customers.find((c) => c.id === value);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-10 px-4 text-sm text-left bg-white border rounded-xl
          flex items-center justify-between gap-2
          transition-all duration-200
          ${error ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-900"}
          focus:outline-none focus:shadow-[0_0_0_3px_rgba(26,26,26,0.1)]
          hover:border-gray-400
          ${className}
        `}
      >
        <span className={selectedCustomer ? "text-gray-900" : "text-gray-400"}>
          {selectedCustomer ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selectedCustomer.name}</span>
              <span className="text-xs text-gray-500">({selectedCustomer.taxId})</span>
            </span>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou CPF/CNPJ..."
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : customers.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">
                  {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                </p>
                {search && (
                  <p className="text-xs text-gray-400 mt-1">
                    Tente buscar por outro nome ou CPF/CNPJ
                  </p>
                )}
              </div>
            ) : (
              <div className="py-1">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelect(customer.id)}
                    className={`
                      w-full px-4 py-2.5 text-left text-sm
                      flex items-center justify-between gap-2
                      hover:bg-gray-50 transition-colors
                      ${value === customer.id ? "bg-blue-50" : ""}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{customer.taxId}</span>
                        {customer.phone && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">{customer.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {value === customer.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Total count */}
          {!isLoading && customers.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                {customers.length} {customers.length === 1 ? "cliente" : "clientes"}
                {search && " encontrado(s)"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

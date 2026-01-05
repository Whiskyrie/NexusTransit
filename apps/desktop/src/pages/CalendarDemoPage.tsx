import { useState } from "react";
import { Calendar, DatePicker, DateRangePicker } from "../components/ui";
import { Calendar as CalendarIcon, Package, TrendingUp } from "lucide-react";

export function CalendarDemoPage() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [pickerDate, setPickerDate] = useState<Date>();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Dados de exemplo - entregas programadas
  const deliveryEvents = {
    "2026-01-10": { type: "deliveries" as const, count: 16 },
    "2026-01-11": { type: "pending" as const, count: 11 },
    "2026-01-15": { type: "deliveries" as const, count: 8 },
    "2026-01-20": { type: "overdue" as const, count: 3 },
    "2026-01-25": { type: "deliveries" as const, count: 12 },
  };

  return (
    <div className="p-8 bg-[#F5F5F0] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#1A1A1A] to-gray-700 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Calendário</h1>
            <p className="text-sm text-[#6B6B6B]">
              Componentes de calendário do sistema NexusTransit
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar Component */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Calendário Principal</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Calendário com indicadores de entregas programadas
            </p>
          </div>

          <Calendar value={selectedDate} onChange={setSelectedDate} events={deliveryEvents} />

          {selectedDate && (
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm font-medium text-[#1A1A1A]">Data selecionada:</p>
              <p className="text-lg font-semibold text-[#1A1A1A] mt-1">
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "full",
                }).format(selectedDate)}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-3">Legenda</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span className="text-sm text-[#6B6B6B]">Entregas programadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                <span className="text-sm text-[#6B6B6B]">Pendentes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-sm text-[#6B6B6B]">Atrasadas</span>
              </div>
            </div>
          </div>
        </div>

        {/* DatePicker & DateRangePicker */}
        <div className="space-y-6">
          {/* DatePicker */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">DatePicker</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Seletor de data com dropdown de calendário
            </p>

            <DatePicker
              label="Data de entrega"
              value={pickerDate}
              onChange={setPickerDate}
              placeholder="Selecione a data da entrega"
              clearable
            />

            {pickerDate && (
              <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                  Valor Selecionado
                </p>
                <p className="text-sm font-medium text-[#1A1A1A] mt-1">
                  {pickerDate.toISOString()}
                </p>
              </div>
            )}
          </div>

          {/* DateRangePicker */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">DateRangePicker</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">Seletor de período com presets rápidos</p>

            <DateRangePicker label="Período de análise" value={dateRange} onChange={setDateRange} />

            {(dateRange.start || dateRange.end) && (
              <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2">
                  Período Selecionado
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#6B6B6B]">Início</p>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {dateRange.end ? new Intl.DateTimeFormat("pt-BR").format(dateRange.end) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B]">Fim</p>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {dateRange.end ? new Intl.DateTimeFormat("pt-BR").format(dateRange.end) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-green-700" strokeWidth={2} />
                <p className="text-xs font-medium text-green-700">Entregas</p>
              </div>
              <p className="text-2xl font-bold text-green-900">47</p>
              <p className="text-xs text-green-600 mt-1">Este mês</p>
            </div>

            <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-700" strokeWidth={2} />
                <p className="text-xs font-medium text-blue-700">Crescimento</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">+24%</p>
              <p className="text-xs text-blue-600 mt-1">vs. mês anterior</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

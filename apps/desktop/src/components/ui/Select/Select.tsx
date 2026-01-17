import { Fragment, useMemo } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Label } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

import type { SelectProps, SelectOption } from "./Select.types";
import {
  cn,
  containerStyles,
  labelStyles,
  valueStyles,
  chevronStyles,
  optionsContainerStyles,
  checkIconStyles,
  errorStyles,
  getButtonClasses,
  getOptionClasses,
} from "./Select.styles";

/**
 * Componente Select genérico utilizando Headless UI
 *
 * @example
 * // Uso básico
 * <Select
 *   options={[
 *     { value: 'opt1', label: 'Opção 1' },
 *     { value: 'opt2', label: 'Opção 2' },
 *   ]}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   placeholder="Selecione uma opção"
 * />
 *
 * @example
 * // Com label e erro
 * <Select
 *   label="Status"
 *   options={statusOptions}
 *   value={status}
 *   onChange={setStatus}
 *   error="Campo obrigatório"
 * />
 *
 * @example
 * // Com renderização customizada
 * <Select
 *   options={userOptions}
 *   value={userId}
 *   onChange={setUserId}
 *   renderOption={(option, selected) => (
 *     <div className="flex items-center gap-2">
 *       <Avatar src={option.icon} />
 *       <span>{option.label}</span>
 *     </div>
 *   )}
 * />
 */
export function Select<T extends string | number = string>({
  options,
  value,
  onChange,
  label,
  placeholder = "Selecione uma opção",
  disabled = false,
  error,
  compact = false,
  position = "bottom",
  className,
  buttonClassName,
  id,
  name,
  required,
  renderOption,
  renderValue,
}: SelectProps<T>) {
  // Encontra a opção selecionada baseada no valor
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  // Renderiza o conteúdo do botão (valor selecionado ou placeholder)
  const renderButtonContent = () => {
    if (!selectedOption) {
      return <span className={valueStyles.placeholder}>{placeholder}</span>;
    }

    if (renderValue) {
      return renderValue(selectedOption);
    }

    return (
      <span className={valueStyles.selected}>
        {selectedOption.icon && (
          <span className="mr-2 inline-flex items-center">{selectedOption.icon}</span>
        )}
        {selectedOption.label}
      </span>
    );
  };

  // Renderiza uma opção individual
  const renderOptionContent = (option: SelectOption<T>, selected: boolean) => {
    if (renderOption) {
      return renderOption(option, selected);
    }

    return (
      <div className="flex items-center">
        {option.icon && <span className="mr-2 shrink-0">{option.icon}</span>}
        <div className="flex flex-col">
          <span className="block truncate">{option.label}</span>
          {option.description && (
            <span className="block text-xs text-gray-500 truncate">{option.description}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(containerStyles, className)}>
      <Listbox as="div" value={value} onChange={onChange} disabled={disabled} name={name}>
        {({ open }) => (
          <>
            {label && (
              <Label className={compact ? labelStyles.compact : labelStyles.default}>
                {label}
                {required && <span className="text-[#EF4444] ml-0.5">*</span>}
              </Label>
            )}

            <div className="relative">
              <ListboxButton
                id={id}
                className={getButtonClasses(!!error, disabled, open, compact, buttonClassName)}
              >
                {renderButtonContent()}
                <span className={compact ? chevronStyles.compact : chevronStyles.default}>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      open && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </span>
              </ListboxButton>

              <ListboxOptions
                className={cn(
                  optionsContainerStyles.base,
                  position === "top" ? optionsContainerStyles.top : optionsContainerStyles.bottom,
                )}
                transition
              >
                {options.map((option) => (
                  <ListboxOption
                    key={String(option.value)}
                    value={option.value}
                    disabled={option.disabled}
                    as={Fragment}
                  >
                    {({ active, selected, disabled: optionDisabled }) => (
                      <div className={getOptionClasses(active, selected, optionDisabled)}>
                        {renderOptionContent(option, selected)}

                        {selected && (
                          <span className={checkIconStyles}>
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </>
        )}
      </Listbox>

      {error && <p className={errorStyles}>{error}</p>}
    </div>
  );
}

Select.displayName = "Select";

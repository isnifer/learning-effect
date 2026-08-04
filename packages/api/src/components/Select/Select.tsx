import type { Key } from 'react-aria-components'
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

interface SelectOption<TValue extends Key> {
  value: TValue
  label: string
}

interface SelectProps<TValue extends Key> {
  ariaLabel: string
  value: TValue | null
  options: ReadonlyArray<SelectOption<TValue>>
  onChange: (value: TValue) => void
  isDisabled?: boolean
  size?: 'sm' | 'default'
  triggerClassName?: string
}

export default function Select<TValue extends Key>({
  ariaLabel,
  value,
  options,
  onChange,
  isDisabled,
  size,
  triggerClassName,
}: SelectProps<TValue>) {
  return (
    <SelectRoot
      aria-label={ariaLabel}
      value={value}
      isDisabled={isDisabled}
      onChange={value => {
        const option = options.find(option => option.value === value)

        if (option) {
          onChange(option.value)
        }
      }}>
      <SelectTrigger className={triggerClassName} size={size}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} id={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}

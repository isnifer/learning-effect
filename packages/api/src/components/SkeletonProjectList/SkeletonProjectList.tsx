import { Fragment } from 'react'
import { Item, ItemActions, ItemContent, ItemGroup, ItemSeparator } from '#/components/ui/item'
import { Skeleton } from '#/components/ui/skeleton'

export default function SkeletonProjectList() {
  return (
    <ItemGroup className="gap-0" aria-label="Loading Projects">
      {Array.from({ length: 3 }, (_, index) => (
        <Fragment key={index}>
          {index > 0 && <ItemSeparator className="my-0" />}
          <Item role="listitem" className="rounded-none px-0 py-4">
            <ItemContent>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </ItemContent>
            <ItemActions>
              <Skeleton className="h-8 w-24" />
            </ItemActions>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  )
}

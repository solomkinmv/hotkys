import React from "react";

interface MasonryGridProps<T> {
  items: T[];
  getItemHeight: (item: T) => number;
  renderItem: (item: T) => React.ReactNode;
  columnWidth?: string;
}

function distributeIntoColumns<T>(
  items: T[],
  columnCount: number,
  getItemHeight: (item: T) => number,
): T[][] {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  const columnHeights = Array(columnCount).fill(0);

  const sortedItems = [...items].sort(
    (a, b) => getItemHeight(b) - getItemHeight(a),
  );

  sortedItems.forEach((item) => {
    const height = getItemHeight(item);
    const shortestColumnIndex = columnHeights.indexOf(
      Math.min(...columnHeights),
    );
    columns[shortestColumnIndex].push(item);
    columnHeights[shortestColumnIndex] += height;
  });

  return columns.filter((col) => col.length > 0);
}

function ColumnLayout<T>({
  items,
  columnCount,
  getItemHeight,
  renderItem,
  columnWidth = "w-72",
}: MasonryGridProps<T> & { columnCount: number }) {
  const columns = distributeIntoColumns(items, columnCount, getItemHeight);
  return (
    <div className="flex gap-4 justify-center">
      {columns.map((column, colIndex) => (
        <div key={colIndex} className={`flex flex-col gap-4 ${columnWidth}`}>
          {column.map((item, itemIndex) => (
            <React.Fragment key={itemIndex}>{renderItem(item)}</React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

export function MasonryGrid<T>(props: MasonryGridProps<T>) {
  return (
    <>
      <div className="hidden xl:block">
        <ColumnLayout {...props} columnCount={4} />
      </div>
      <div className="hidden lg:block xl:hidden">
        <ColumnLayout {...props} columnCount={3} />
      </div>
      <div className="hidden sm:block lg:hidden">
        <ColumnLayout {...props} columnCount={2} />
      </div>
      <div className="block sm:hidden">
        <ColumnLayout {...props} columnCount={1} />
      </div>
    </>
  );
}

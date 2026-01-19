/**
 * TabsWithContent Component
 * Tabs com gerenciamento automático de estado e renderização de conteúdo
 *
 * @example
 * <TabsWithContent
 *   defaultTab="list"
 *   tabs={[
 *     { id: 'list', label: 'Lista', content: <MyList /> },
 *     { id: 'stats', label: 'Stats', content: <MyStats /> }
 *   ]}
 * />
 */

import { memo, useState } from "react";
import { Tabs } from "./Tabs";
import type { TabsWithContentProps } from "./TabsWithContent.types";

export const TabsWithContent = memo<TabsWithContentProps>(function TabsWithContent({
  tabs,
  defaultTab,
  variant = "default",
  className,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="space-y-6">
      <Tabs
        items={tabs.map(({ content, ...tab }) => tab)}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant={variant}
        className={className}
      />

      {activeContent && <div className="animate-in fade-in duration-200">{activeContent}</div>}
    </div>
  );
});

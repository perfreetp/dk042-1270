import { useResourceStore } from '@/store/useResourceStore';
import ResourceDetailPanel from '@/pages/ResourceMap/ResourceDetailPanel';

export default function GlobalResourceDetail() {
  const { resources, selectedResourceId, showDetailPanel, toggleDetailPanel } = useResourceStore();
  const selectedResource = resources.find(r => r.id === selectedResourceId);

  if (!showDetailPanel || !selectedResource) return null;

  return (
    <div className="fixed right-0 top-0 h-full z-40">
      <ResourceDetailPanel
        resource={selectedResource}
        onClose={() => toggleDetailPanel(false)}
      />
    </div>
  );
}

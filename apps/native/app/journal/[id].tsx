import { useLocalSearchParams } from 'expo-router';

import { EditorScreen } from '@/src/features/journal/EditorScreen';

/** Route files read params and render one feature component. Nothing else. */
export default function JournalEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditorScreen id={id} />;
}

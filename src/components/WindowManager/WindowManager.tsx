import { useWindowContext } from '../../context/WindowContext';
import { Window } from '../Window';

export default function WindowManager() {
  const { windows } = useWindowContext();

  const windowList = Array.from(windows.values());

  return (
    <>
      {windowList.map(windowState => (
        <Window key={windowState.id} window={windowState} />
      ))}
    </>
  );
}

import { useNavigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export function useMenuNavigation() {
    const navigate = useNavigate();

    useEffect(() => {
        let unlisten: (() => void) | undefined;

        listen<string>('navigate', (event) => {
            console.log('menu navigation event: ', event.payload);
            switch (event.payload) {
                case 'home':     navigate('/');         break;
                case 'tasks':    navigate('/tasks');    break;
                case 'calendar': navigate('/calendar'); break;
                case 'blocks':   navigate('/blocks');   break;
                case 'profile':
                    window.dispatchEvent(new Event('dbd:open-profile'));
                    break;
                case 'settings':
                    window.dispatchEvent(new Event('dbd:open-settings'));
                    break;
                case 'help':     navigate('/help');     break;
            }
        }).then(fn => { unlisten = fn; });

        return () => {
            unlisten?.();
        };
    }, [navigate]);
}
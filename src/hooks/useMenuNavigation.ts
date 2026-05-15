import { useNavigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

const ZOOM_STORAGE_KEY = 'dbd:zoom-level';
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;

function clampZoom(value: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function useMenuNavigation() {
    const navigate = useNavigate();

    useEffect(() => {
        let unlistenNavigate: (() => void) | undefined;
        let unlistenZoom: (() => void) | undefined;
        let zoomLevel = DEFAULT_ZOOM;

        const applyZoom = (value: number) => {
            zoomLevel = clampZoom(value);
            document.documentElement.style.zoom = zoomLevel.toFixed(2);
            localStorage.setItem(ZOOM_STORAGE_KEY, zoomLevel.toString());
        };

        const savedZoom = Number(localStorage.getItem(ZOOM_STORAGE_KEY));
        if (Number.isFinite(savedZoom)) {
            applyZoom(savedZoom);
        } else {
            applyZoom(DEFAULT_ZOOM);
        }

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
                case 'toolkit':  navigate('/toolkit');  break;
            }
        }).then(fn => { unlistenNavigate = fn; });

        listen<string>('menu-zoom', (event) => {
            switch (event.payload) {
                case 'in':
                    applyZoom(zoomLevel + ZOOM_STEP);
                    break;
                case 'out':
                    applyZoom(zoomLevel - ZOOM_STEP);
                    break;
                case 'reset':
                    applyZoom(DEFAULT_ZOOM);
                    break;
            }
        }).then(fn => { unlistenZoom = fn; });

        return () => {
            unlistenNavigate?.();
            unlistenZoom?.();
        };
    }, [navigate]);
}
import {MetadataRoute} from 'next';

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Hotkys',
        short_name: 'Hotkys',
        description: 'Collection of useful shortcuts for different applications',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff',
        theme_color: '#fff',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    }
}

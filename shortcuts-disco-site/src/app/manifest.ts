import {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Shortcuts Disco',
        short_name: 'Shortcuts Disco',
        description: 'Shortcuts Disco is a tool to help you search keyboard shortcuts for applications',
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

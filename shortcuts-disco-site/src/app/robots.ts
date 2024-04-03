import {MetadataRoute} from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/private/',
        },
        sitemap: 'https://shortcuts.solomk.in/sitemap.xml',
    }
}

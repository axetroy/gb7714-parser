import { defineConfig } from 'vitepress'
import { resolve } from 'path'

export default defineConfig({
  title: 'GB/T 7714 Parser',
  description: 'GB/T 7714 参考文献格式解析库',
  base: '/gb7714-parser/',
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Playground', link: '/playground/' },
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '简介', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '支持的文献类型', link: '/guide/supported-types' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/' },
            { text: 'parse', link: '/api/parse' },
            { text: 'format', link: '/api/format' },
            { text: 'validate', link: '/api/validate' },
            { text: 'parseCitation', link: '/api/parse-citation' },
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/axetroy/gb7714-parser' }
    ],
    
    footer: {
      message: '基于 GB/T 7714-2015 和 GB/T 7714-2025 国家标准',
      copyright: 'Copyright © 2025 Axetroy'
    }
  },
  
  vite: {
    resolve: {
      alias: {
        'gb7714-parser': resolve(__dirname, '../../src/index.ts')
      }
    }
  }
})

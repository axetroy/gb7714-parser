import { describe, it, expect } from 'vitest';
import { MapFormatter } from '../../formatter/types/8.13-cm-map-formatter.js';
import type { Map } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('MapFormatter', () => {
  const formatter = new MapFormatter({});

  describe('format', () => {
    it('应该格式化地图', () => {
      const reference: Map = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        scale: '1:25000',
        dimensions: '128 cm × 84 cm',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 地图标题. 1:25000[CM].');
    });

    it('应该格式化带有出版者信息的地图', () => {
      const reference: Map = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        scale: '1:25000',
        publisherPlace: '北京',
        publisher: '地图出版社',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 地图标题. 1:25000[CM]. 北京: 地图出版社, 2025.');
    });

    it('应该格式化带有尺寸的地图', () => {
      const reference: Map = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        scale: '1:25000',
        publisherPlace: '北京',
        publisher: '地图出版社',
        year: '2025',
        dimensions: '128 cm × 84 cm',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 地图标题. 1:25000[CM]. 北京: 地图出版社, 2025. 128 cm × 84 cm.');
    });

    it('应该格式化带有版本的地图', () => {
      const reference: Map = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        version: '第2版',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 地图标题[CM]. 第2版.');
    });

    it('应该格式化带有 URL 的地图', () => {
      const reference: Map = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 地图标题[CM]. https://example.com');
    });

    it('应该格式化带有 id 的地图', () => {
      const reference: Map = {
        type: ReferenceType.CM,
        id: '42',
        authors: [{ name: '张三' }],
        title: '地图标题',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[42] 张三. 地图标题[CM].');
    });

    it('应该格式化没有作者的地图', () => {
      const reference: Map = {
        type: ReferenceType.CM,
        authors: [],
        title: '地图标题',
        scale: '1:25000',
      };
      const result = formatter.format(reference);
      expect(result).toBe('地图标题. 1:25000[CM].');
    });
  });
});

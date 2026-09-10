import { describe, it, expect } from 'vitest';
import { ProceedingsFormatter } from '../../formatter/types/8.6-c-proceedings-formatter.js';
import type { Proceedings } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('ProceedingsFormatter', () => {
  const formatter = new ProceedingsFormatter({});

  describe('format', () => {
    it('应该格式化带有会议信息的会议录', () => {
      const reference: Proceedings = {
        type: ReferenceType.C,
        authors: [{ name: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
        conferenceYear: '2025',
        pages: '100-110',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 会议论文集[C]. //国际人工智能大会, 2025: 100-110.');
    });

    it('应该格式化没有 conferenceYear 的会议录', () => {
      const reference: Proceedings = {
        type: ReferenceType.C,
        authors: [{ name: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 会议论文集[C].');
    });

    it('应该格式化没有会议名称的会议录', () => {
      const reference: Proceedings = {
        type: ReferenceType.C,
        authors: [{ name: '张三' }],
        title: '会议论文集',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 会议论文集[C].');
    });

    it('应该格式化带有 URL 的会议录', () => {
      const reference: Proceedings = {
        type: ReferenceType.C,
        authors: [{ name: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
        conferenceYear: '2025',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 会议论文集[C]. //国际人工智能大会, 2025. https://example.com');
    });

    it('应该格式化带有 id 的会议录', () => {
      const reference: Proceedings = {
        type: ReferenceType.C,
        id: '5',
        authors: [{ name: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
        conferenceYear: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[5] 张三 会议论文集[C]. //国际人工智能大会, 2025.');
    });

    it('应该格式化没有作者的会议录', () => {
      const reference: Proceedings = {
        type: ReferenceType.C,
        authors: [],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
        conferenceYear: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe(' 会议论文集[C]. //国际人工智能大会, 2025.');
    });
  });
});
